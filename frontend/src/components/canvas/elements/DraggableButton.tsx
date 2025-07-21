import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FC, CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Paper from '@mui/material/Paper';
import ContextMenu from './ContextMenu';

export interface DraggableButtonProps {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex?: number;
  variant?: 'text' | 'contained' | 'outlined';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  isSelected: boolean;
  onClick: (e: ReactMouseEvent) => void;
  onLabelChange?: (id: string, newLabel: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
  style?: CSSProperties;
  onDelete?: (id: string) => void;
  onDragMove?: (id: string, dx: number, dy: number) => void;
  onDragEnd?: (id: string) => void;
  checked?: boolean;
  onSetMoveMode?: (id: string, mode: 'move' | 'resize' | null) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  inMoveMode?: boolean;
  onChange?: (updates: Record<string, any>) => void;
  onSelect?: () => void;
}

export const DraggableButton: FC<DraggableButtonProps> = ({
  id,
  text,
  x,
  y,
  width: initialWidth = 120,
  height: initialHeight = 40,
  zIndex,
  isSelected,
  onClick,
  onResize,
  style,
  onDelete,
  onDragMove,
  onDragEnd,
  inMoveMode = false,
  onSelect
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight
  });
  const [hover, setHover] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  // Clean up any global styles when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  useEffect(() => {
    setDimensions({ width: initialWidth, height: initialHeight });
  }, [initialWidth, initialHeight]);

  const handleContextMenu = (event: ReactMouseEvent) => {
    event.preventDefault();
    onSelect?.();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX, mouseY: event.clientY }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
    handleCloseContextMenu();
  };

  const handleMove = () => {
    setIsResizing(false);
    handleCloseContextMenu();
  };

  const handleResize = () => {
    setIsResizing(true);
    handleCloseContextMenu();
  };

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.stopPropagation();
    
    setStartPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
    onSelect?.();
  }, [onSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    
    if (isResizing) {
      const newWidth = Math.max(80, dimensions.width + dx);
      const newHeight = Math.max(32, dimensions.height + dy);
      setDimensions({ width: newWidth, height: newHeight });
      if (onResize) {
        onResize(id, newWidth, newHeight);
      }
    } else {
      if (onDragMove) {
        onDragMove(id, dx, dy);
      }
    }
    
    setStartPos({ x: e.clientX, y: e.clientY });
  }, [isDragging, isResizing, startPos, onDragMove, id, dimensions, onResize]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      if (onDragEnd) {
        onDragEnd(id);
      }
    }
  }, [isDragging, isResizing, onDragEnd, id]);

  // Set up event listeners for dragging/resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleMouseEnter = () => {
    setHover(true);
  };

  const handleMouseLeave = () => {
    setHover(false);
  };

  return (
    <Box
      ref={buttonRef}
      position="absolute"
      left={x}
      top={y}
      width={dimensions.width}
      height={dimensions.height}
      zIndex={zIndex}
      sx={{
        border: isSelected ? '2px dashed #1976d2' : 'none',
        '&:hover': {
          cursor: inMoveMode ? 'move' : 'default',
        },
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
        onClick(e);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'white',
        }}
        variant={isSelected ? 'outlined' : 'elevation'}
      >
        {/* Delete button */}
        {isSelected && hover && onDelete && (
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 1,
              backgroundColor: 'white',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}

        {/* Resize handle */}
        {isSelected && !isResizing && (
          <Box
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              setStartPos({ x: e.clientX, y: e.clientY });
              onSelect?.();
            }}
            sx={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 12,
              height: 12,
              backgroundColor: '#1976d2',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 2,
              border: '1px solid white',
            }}
          />
        )}

        {/* Button content */}
        <Box
          component="button"
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 0,
            '&:focus': {
              outline: 'none',
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
            onClick(e);
          }}
        >
          {text}
        </Box>

        {/* Context Menu */}
        <ContextMenu
          contextMenu={contextMenu}
          onClose={handleCloseContextMenu}
          onDelete={handleDelete}
          onMove={handleMove}
          onResize={handleResize}
        />
      </Paper>
    </Box>
  );
};

export default DraggableButton;
