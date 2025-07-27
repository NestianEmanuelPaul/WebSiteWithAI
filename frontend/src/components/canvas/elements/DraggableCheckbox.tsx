import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Checkbox, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { CheckboxElement } from '../../../types/element';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { createGlobalStyle } from 'styled-components';

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

const GlobalResizeStyles = createGlobalStyle`
  /* Prevent text selection during resize */
  body.resizing {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
  
  /* Ensure resize handle is always visible when selected */
  .resize-handle {
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .resize-handle:hover,
  .Mui-selected .resize-handle {
    opacity: 1;
  }
`;

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
    // Don't do anything if it's a right click
    if (e.button === 2) return;
    
    // Don't do anything if it's the checkbox input being clicked
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    // Check if we're clicking on the resize handle
    const isResizeHandle = target === resizeHandleRef.current || 
                         (resizeHandleRef.current && resizeHandleRef.current.contains(target));
    
    console.log('Mouse down on checkbox:', { 
      target, 
      isResizeHandle,
      resizeHandleElement: resizeHandleRef.current 
    });
    
    if (isResizeHandle) {
      console.log('Starting resize');
      setIsResizing(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';
    } else {
      // Only start dragging if not resizing and not clicking on the checkbox input
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'move';
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    console.log('Mouse move - isDragging:', isDragging, 'isResizing:', isResizing);
    
    if (isDragging && onDragMove) {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      console.log('Dragging - dx:', dx, 'dy:', dy);
      onDragMove(id, dx, dy);
      setStartPos({ x: e.clientX, y: e.clientY });
    } else if (isResizing) {
      // Calculate the new dimensions based on mouse movement
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      // Calculate new dimensions while maintaining minimum size
      const newWidth = Math.max(120, dimensions.width + deltaX);
      const newHeight = Math.max(32, dimensions.height + deltaY);
      
      console.log('Resizing - new dimensions:', { 
        width: newWidth, 
        height: newHeight,
        deltaX,
        deltaY,
        startX: startPos.x,
        startY: startPos.y,
        clientX: e.clientX,
        clientY: e.clientY
      });
      
      // Update local state for immediate visual feedback
      setDimensions({ width: newWidth, height: newHeight });
      
      // Notify parent about resize (consistent with DraggableButton)
      if (onResize) {
        onResize(id, newWidth, newHeight);
      }
      // Keep other properties in sync via onUpdate if provided (excluding size to avoid duplicate state)
      if (onUpdate) {
        onUpdate({
          ...(label !== undefined && { label }),
          ...(checked !== undefined && { checked }),
        });
      }
      
      // Update start position for the next move to make resizing smoother
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, startPos, onDragMove, onUpdate, id, dimensions, label, checked, onResize]);

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up - wasDragging:', isDragging, 'wasResizing:', isResizing);
    
    // Only reset cursor and selection if we were actually dragging or resizing
    if (isDragging || isResizing) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // If we were resizing, make sure to update the final dimensions
      if (isResizing) {
        console.log('Final dimensions after resize:', dimensions);
        // onUpdate({ 
        //   width: dimensions.width,
        //   height: dimensions.height,
        //   ...(label !== undefined && { label }),
        //   ...(checked !== undefined && { checked })
        // });
      }
      
      // Reset states
      setIsDragging(false);
      setIsResizing(false);
      
      // Call onDragEnd if we were dragging
      if (isDragging && onDragEnd) {
        onDragEnd(id);
      }
    }
  }, [isDragging, isResizing, dimensions, id, onDragEnd, onUpdate, label, checked]);

  useEffect(() => {
    // Only add event listeners if we're actively dragging or resizing
    const needsListeners = isDragging || isResizing;
    
    if (needsListeners) {
      console.log('Adding event listeners for', isDragging ? 'dragging' : 'resizing');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection during drag/resize
      document.body.style.userSelect = 'none';
      
      // Cleanup function
      return () => {
        console.log('Removing event listeners');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Only reset cursor if we're not in the middle of an operation
        if (!isDragging && !isResizing) {
          document.body.style.userSelect = '';
          document.body.style.cursor = '';
        }
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

  // Resize handle component
  const ResizeHandle = useMemo(() => {
    const handleMouseDown = (e: React.MouseEvent) => {
      console.log('Resize handle mouse down - event:', {
        target: e.target,
        currentTarget: e.currentTarget,
        clientX: e.clientX,
        clientY: e.clientY
      });
      
      e.stopPropagation();
      e.preventDefault();
      
      // Set initial position for resizing
      setIsResizing(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'nwse-resize';
      
      // Add a temporary class to the body to prevent text selection during resize
      document.body.classList.add('resizing');
      
      // Add a one-time mouseup listener to clean up
      const handleMouseUp = () => {
        console.log('Resize handle mouse up');
        document.body.style.cursor = '';
        document.body.classList.remove('resizing');
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mouseup', handleMouseUp, { once: true });
    };
    
    return function ResizeHandleComponent() {
      return (
        <div 
          ref={resizeHandleRef}
          className="resize-handle"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            backgroundColor: isSelected ? '#4CAF50' : 'transparent',
            borderBottom: '2px solid #4CAF50',
            borderRight: '2px solid #4CAF50',
            cursor: 'nwse-resize',
            zIndex: 1001,
            pointerEvents: 'auto',
            boxSizing: 'border-box',
          }}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            console.log('Resize handle click');
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      );
    };
  }, [isSelected, resizeHandleRef]);

  return (
    <React.Fragment>
      <GlobalResizeStyles />
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
          cursor: 'default',
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
            cursor: 'default',
          }}
        >
          <Checkbox
            checked={checked}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{ 
              mr: 1,
              cursor: 'pointer',
            }}
          />
          <Box 
            sx={{ 
              flexGrow: 1, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              cursor: 'move',
              userSelect: 'none',
            }}
            onMouseDown={(e) => {
              if (!isResizing) {
                handleMouseDown(e);
              }
            }}
          >
            {label}
          </Box>
          
          {isSelected && <ResizeHandle />}
          
          {isSelected && (
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                transform: 'translate(50%, -50%)',
                backgroundColor: 'error.main',
                color: 'white',
                width: 20,
                height: 20,
                '&:hover': {
                  backgroundColor: 'error.dark',
                },
              }}
              aria-label="delete"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Paper>
      </Box>
    </React.Fragment>
  );
};

export default DraggableCheckbox;
