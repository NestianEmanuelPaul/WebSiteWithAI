import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FC, CSSProperties, MouseEvent as ReactMouseEvent, ChangeEvent, Ref } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Paper from '@mui/material/Paper';

interface DraggableButtonProps {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
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
}

export const DraggableButton: FC<DraggableButtonProps> = ({
  id,
  text,
  x,
  y,
  width: initialWidth = 120,
  height: initialHeight = 40,
  isSelected,
  onClick,
  onLabelChange,
  onResize,
  style,
  onDelete,
  onDragMove,
  onDragEnd,
  onContextMenu,
  inMoveMode = false,
  onSetMoveMode}) => {
  const [hover, setHover] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight
  });
  const [isResizing, setIsResizing] = useState(false);
  const [mode, setMode] = useState<'move' | 'resize'>('move');

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

  // Resize functionality
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    if (mode !== 'resize') return;
    
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('e')) newWidth = Math.max(80, startWidth + deltaX);
      if (direction.includes('s')) newHeight = Math.max(32, startHeight + deltaY);
      
      setDimensions({ width: newWidth, height: newHeight });
      
      if (onResize) {
        onResize(id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
  }, [mode, dimensions, isResizing, onResize, id]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent drag if resizing or not in move mode
    if (isResizing || mode !== 'move') {
      e.stopPropagation();
      return;
    }
    
    console.log('BUTTON: MouseDown event', { id, inMoveMode });
    e.stopPropagation();
    
    // Only allow dragging in move mode
    if (!inMoveMode) {
      console.log('BUTTON: Not in move mode, ignoring drag');
      return;
    }
    
    console.log('BUTTON: Starting drag for', id);
    
    // Store the offset from the mouse to the element's top-left corner
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // Create move handler with correct event type
    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      // Calculate the new position based on mouse position and initial offset
      const mouseX = moveEvent.clientX;
      const mouseY = moveEvent.clientY;
      
      console.log('BUTTON: Mouse position', { id, mouseX, mouseY, offsetX, offsetY });
      
      // Call the parent's drag handler with the absolute position
      if (onDragMove) {
        onDragMove(id, mouseX - offsetX, mouseY - offsetY);
      }
      
      // Prevent text selection during drag
      moveEvent.preventDefault();
    };
    
    // Create mouse up handler with correct event type
    const handleUp = (upEvent: globalThis.MouseEvent) => {
      console.log('BUTTON: Drag end', { id });
      
      // Clean up event listeners
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      
      // Call drag end handler
      if (onDragEnd) {
        onDragEnd(id);
      }
      
      // Prevent any default browser behavior
      upEvent.preventDefault();
      upEvent.stopPropagation();
    };
    
    // Add event listeners with correct types
    console.log('BUTTON: Adding event listeners for', id);
    window.addEventListener('mousemove', handleMove as EventListener, { passive: false });
    window.addEventListener('mouseup', handleUp as EventListener, { once: true });
    
    // Prevent default to avoid text selection
    e.preventDefault();
  }, [mode, isResizing, inMoveMode, onDragMove, onDragEnd, id]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (onLabelChange) {
      onLabelChange(id, e.target.value);
    }
  }, [onLabelChange, id]);

  // Handle context menu at the document level
  useEffect(() => {
    if (!buttonRef.current) return;
    
    let contextMenu: HTMLDivElement | null = null;

    const handleGlobalContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only handle context menu events that originate from this button
      if (buttonRef.current && buttonRef.current.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Close any existing menu
        if (contextMenu) {
          document.body.removeChild(contextMenu);
          contextMenu = null;
        }
        
        // Create and show new menu
        contextMenu = document.createElement('div');
        contextMenu.className = 'custom-context-menu';
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        contextMenu.style.zIndex = '9999';
        contextMenu.style.borderRadius = '4px';
        contextMenu.style.padding = '4px 0';
        contextMenu.style.pointerEvents = 'auto';

        const moveOption = document.createElement('div');
        moveOption.textContent = 'Move';
        moveOption.style.padding = '8px 16px';
        moveOption.style.cursor = 'pointer';
        moveOption.style.pointerEvents = 'auto';
        moveOption.style.userSelect = 'none';
        moveOption.onmouseover = () => moveOption.style.backgroundColor = '#f0f0f0';
        moveOption.onmouseout = () => moveOption.style.backgroundColor = 'transparent';
        moveOption.onclick = (menuEvent) => {
          menuEvent.stopPropagation();
          setMode('move');
          if (onSetMoveMode) {
            onSetMoveMode(id, 'move');
          }
          if (contextMenu) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
          }
          return false;
        };
        
        const resizeOption = document.createElement('div');
        resizeOption.textContent = 'Resize';
        resizeOption.style.padding = '8px 16px';
        resizeOption.style.cursor = 'pointer';
        resizeOption.style.pointerEvents = 'auto';
        resizeOption.style.userSelect = 'none';
        resizeOption.onmouseover = () => resizeOption.style.backgroundColor = '#f0f0f0';
        resizeOption.onmouseout = () => resizeOption.style.backgroundColor = 'transparent';
        resizeOption.onclick = (menuEvent) => {
          menuEvent.stopPropagation();
          setMode('resize');
          if (onSetMoveMode) {
            onSetMoveMode(id, 'resize');
          }
          if (contextMenu) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
          }
          return false;
        };
        
        contextMenu.appendChild(moveOption);
        contextMenu.appendChild(resizeOption);
        document.body.appendChild(contextMenu);
        
        // Close menu when clicking outside
        const closeMenu = (clickEvent: MouseEvent) => {
          if (contextMenu && !contextMenu.contains(clickEvent.target as Node)) {
            if (document.body.contains(contextMenu)) {
              document.body.removeChild(contextMenu);
            }
            contextMenu = null;
            document.removeEventListener('mousedown', closeMenu);
          }
        };
        
        document.addEventListener('mousedown', closeMenu);
      }
    };

    // Add global context menu handler with capture phase
    document.addEventListener('contextmenu', handleGlobalContextMenu, { capture: true });

    // Clean up function
    return () => {
      document.removeEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
      if (contextMenu && document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
    };
  }, []);

  return (
    <Paper
      ref={buttonRef as Ref<HTMLDivElement>}
      elevation={isSelected || hover || inMoveMode ? 8 : 2}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        p: 1.5,
        borderRadius: 2,
        cursor: inMoveMode ? 'move' : 'grab',
        boxShadow: isSelected || inMoveMode ? 8 : 2,
        border: inMoveMode ? '2px solid #ff9800' : isSelected ? '2px solid #1976d2' : '1px solid #1976d2',
        minWidth: 80,
        minHeight: 32,
        width: dimensions.width,
        height: dimensions.height,
        display: 'flex',
        flexDirection: 'column',
        outline: inMoveMode ? '2px dashed #ff9800' : undefined,
        backgroundColor: '#1976d2',
        color: 'white',
        backgroundImage: 'none',
        userSelect: 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        // Only trigger onClick if not in resize mode
        if (mode !== 'resize' && onClick) {
          onClick(e);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Context menu is now handled by the global event listener in useEffect
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          pointerEvents: mode === 'resize' ? 'auto' : 'none',
          '& > *': {
            pointerEvents: mode === 'resize' ? 'none' : 'auto',
          },
          position: 'relative',
          '& .resize-handle': {
            position: 'absolute',
            background: '#1976d2',
            border: '1px solid white',
            opacity: mode === 'resize' ? 1 : 0,
            visibility: mode === 'resize' ? 'visible' : 'hidden',
            transition: 'opacity 0.2s, visibility 0.2s',
            zIndex: 10,
          },
          '&:hover .resize-handle': {
            opacity: mode === 'resize' ? 1 : 0,
            visibility: mode === 'resize' ? 'visible' : 'hidden',
          },
          '& .resize-handle-se': {
            right: 0,
            bottom: 0,
            width: '12px',
            height: '12px',
            cursor: 'nwse-resize',
            borderTopLeftRadius: '4px',
          },
          '& .resize-handle-e': {
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            width: '6px',
            height: '40%',
            cursor: 'ew-resize',
            borderTopLeftRadius: '4px',
            borderBottomLeftRadius: '4px',
          },
          '& .resize-handle-s': {
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40%',
            height: '6px',
            cursor: 'ns-resize',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
          },
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Context menu is now handled by the global event listener in useEffect
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            pointerEvents: mode === 'resize' ? 'auto' : 'none',
            '& > *': {
              pointerEvents: mode === 'resize' ? 'none' : 'auto',
            },
            position: 'relative',
            '& .resize-handle': {
              position: 'absolute',
              background: '#1976d2',
              border: '1px solid white',
              opacity: mode === 'resize' ? 1 : 0,
              visibility: mode === 'resize' ? 'visible' : 'hidden',
              transition: 'opacity 0.2s, visibility 0.2s',
              zIndex: 10,
            },
            '&:hover .resize-handle': {
              opacity: mode === 'resize' ? 1 : 0,
              visibility: mode === 'resize' ? 'visible' : 'hidden',
            },
            '& .resize-handle-se': {
              right: 0,
              bottom: 0,
              width: '12px',
              height: '12px',
              cursor: 'nwse-resize',
              borderTopLeftRadius: '4px',
            },
            '& .resize-handle-e': {
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
              width: '6px',
              height: '40%',
              cursor: 'ew-resize',
              borderTopLeftRadius: '4px',
              borderBottomLeftRadius: '4px',
            },
            '& .resize-handle-s': {
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40%',
              height: '6px',
              cursor: 'ns-resize',
              borderTopLeftRadius: '4px',
              borderTopRightRadius: '4px',
            },
          }}
        >
          <div 
            ref={buttonRef}
            onClick={(e) => {
              if (onClick) onClick(e);
            }}
            onContextMenu={onContextMenu}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: inMoveMode ? 'none' : 'auto',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            <div 
              style={{
                fontSize: `${Math.min(dimensions.width / 8, dimensions.height / 2)}px`,
                transition: 'font-size 0.1s ease',
                textAlign: 'center',
                width: '100%',
                padding: '0 4px',
                color: 'white',
              }}
            >
              {onLabelChange ? (
                <input
                  type="text"
                  value={text}
                  onChange={handleInputChange}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    color: 'white',
                    pointerEvents: inMoveMode ? 'none' : 'auto',
                  }}
                />
              ) : (
                text
              )}
            </div>
          </div>
          
          {/* Resize handles */}
          {inMoveMode && (
            <>
              <div 
                className="resize-handle resize-handle-se"
                onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
              />
              <div 
                className="resize-handle resize-handle-e"
                onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
              />
              <div 
                className="resize-handle resize-handle-s"
                onMouseDown={(e) => handleResizeMouseDown(e, 's')}
              />
            </>
          )}
        </Box>
        
        {/* Delete button */}
        {onDelete && (isSelected || hover) && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            sx={{
              position: 'absolute',
              right: -10,
              top: -10,
              backgroundColor: 'white',
              width: 24,
              height: 24,
              boxShadow: 1,
              '&:hover': {
                backgroundColor: '#ffebee',
                color: '#d32f2f',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};
