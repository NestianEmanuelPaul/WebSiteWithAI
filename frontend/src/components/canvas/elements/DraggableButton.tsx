import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC, CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Paper from '@mui/material/Paper';

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
  inMoveMode?: boolean;
  onChange?: (updates: Record<string, any>) => void;
  onSelect?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
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
  onSelect,
  onContextMenu
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
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

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    onSelect?.();
    
    // Only start dragging if not clicking on the delete button or resize handle
    const target = e.target as HTMLElement;
    const isDeleteButton = target.closest('button[aria-label="delete"]') !== null;
    const isResizeHandle = target === resizeHandleRef.current;
    
    if (!isDeleteButton && !isResizeHandle) {
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'move';
    } else if (isResizeHandle) {
      // Handle resize
      e.stopPropagation();
      setIsResizing(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'nwse-resize';
    }
  }, [onSelect]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && onDragMove) {
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        onDragMove(id, dx, dy);
        setStartPos({ x: e.clientX, y: e.clientY });
      } else if (isResizing && onResize) {
        const newWidth = Math.max(80, dimensions.width + (e.clientX - startPos.x));
        const newHeight = Math.max(30, dimensions.height + (e.clientY - startPos.y));
        setDimensions({ width: newWidth, height: newHeight });
        onResize(id, newWidth, newHeight);
        setStartPos({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, isResizing, startPos, onDragMove, onResize, id, dimensions]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    if (onDragEnd) {
      onDragEnd(id);
    }
  }, [id, onDragEnd]);

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

  const handleDelete = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const resizeHandleRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
        onSelect?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
        if (e.button === 0) { // Only handle left click
          onClick(e);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: dimensions.width,
        height: dimensions.height,
        zIndex: zIndex,
        cursor: 'pointer',
        ...style,
      }}
    >
      <Paper
        elevation={isSelected ? 8 : 2}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: isSelected ? 8 : 4,
          },
        }}
      >
        <Box sx={{ textAlign: 'center', padding: 1 }}>{text}</Box>
        
        {isSelected && (
          <>
            <div
              ref={resizeHandleRef}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                backgroundColor: 'primary.main',
                cursor: 'nwse-resize',
                borderTopLeftRadius: '2px',
              }}
            />
            
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                },
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default DraggableButton;
