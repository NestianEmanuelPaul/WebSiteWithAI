import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Checkbox, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { CheckboxElement } from '../../../types/element';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

interface DraggableCheckboxProps extends Omit<CheckboxElement, 'type'> {
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragMove: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onUpdate: (updates: Partial<CheckboxElement>) => void;
  style?: React.CSSProperties;
  zIndex: number;
}

const DraggableCheckbox: React.FC<DraggableCheckboxProps> = ({
  id,
  x,
  y,
  width: initialWidth = 150,
  height: initialHeight = 40,
  label = 'Checkbox',
  checked = false,
  isSelected,
  onSelect,
  onDelete,
  onDragMove,
  onDragEnd,
  onResize,
  onUpdate,
  style,
  zIndex,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
  const [hover, setHover] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Update dimensions when props change
  useEffect(() => {
    setDimensions({ width: initialWidth, height: initialHeight });
  }, [initialWidth, initialHeight]);

  // Clean up any global styles when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    
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
      e.stopPropagation();
      setIsResizing(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'nwse-resize';
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && onDragMove) {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      onDragMove(id, dx, dy);
      setStartPos({ x: e.clientX, y: e.clientY });
    } else if (isResizing && onResize) {
      const newWidth = Math.max(120, dimensions.width + (e.clientX - startPos.x));
      const newHeight = Math.max(32, dimensions.height + (e.clientY - startPos.y));
      setDimensions({ width: newWidth, height: newHeight });
      onResize(id, newWidth, newHeight);
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, startPos, onDragMove, onResize, id, dimensions]);

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onUpdate({ checked: e.target.checked });
  };

  return (
    <Box
      ref={elementRef}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: dimensions.width,
        height: dimensions.height,
        zIndex,
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
          padding: '0 8px',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: isSelected ? 8 : 4,
          },
        }}
      >
        <Checkbox
          checked={checked}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          size="small"
          sx={{ mr: 1 }}
        />
        <Box sx={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </Box>
        
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
              aria-label="delete"
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default DraggableCheckbox;
