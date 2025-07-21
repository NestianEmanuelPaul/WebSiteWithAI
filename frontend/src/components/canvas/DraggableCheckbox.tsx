import React, { useState, useEffect, useCallback } from 'react';
import type { FC, CSSProperties } from 'react';

interface DraggableCheckboxProps {
  id: string;
  text: string;
  x: number;
  y: number;
  checked: boolean;
  isSelected: boolean;
  style?: CSSProperties;
  onClick: (e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  onDragMove?: (id: string, dx: number, dy: number) => void;
  onDragEnd?: (id: string) => void;
  onLabelChange?: (id: string, newLabel: string) => void;
  onCheckChange?: (checked: boolean) => void;
}

const DraggableCheckbox: FC<DraggableCheckboxProps & { onContextMenu?: (e: React.MouseEvent) => void; inMoveMode?: boolean }> = ({
  id,
  text = 'Checkbox',
  x,
  y,
  checked = false,
  isSelected = false,
  style,
  onClick,
  onDelete,
  onDragMove,
  onDragEnd,
  onLabelChange,
  onCheckChange,
  onContextMenu,
  inMoveMode = false,
}) => {
  const [hover, setHover] = useState(false);

  // Clean up any global styles when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('CHECKBOX: MouseDown event', { id, inMoveMode });
    e.stopPropagation();
    
    if (!inMoveMode) {
      console.log('CHECKBOX: Not in move mode, ignoring drag');
      return;
    }
    
    console.log('CHECKBOX: Starting drag for', id);
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const mouseX = moveEvent.clientX;
      const mouseY = moveEvent.clientY;
      
      console.log('CHECKBOX: Mouse position', { id, mouseX, mouseY, offsetX, offsetY });
      
      if (onDragMove) {
        onDragMove(id, mouseX - offsetX, mouseY - offsetY);
      }
      
      moveEvent.preventDefault();
    };
    
    const handleUp = (upEvent: globalThis.MouseEvent) => {
      console.log('CHECKBOX: Drag end', { id });
      
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      
      if (onDragEnd) {
        onDragEnd(id);
      }
      
      upEvent.preventDefault();
    };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp, { once: true });
    
    e.preventDefault();
  }, [id, inMoveMode, onDragMove, onDragEnd]);

  const checkboxStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    padding: '8px',
    borderRadius: '4px',
    cursor: inMoveMode ? 'move' : 'default',
    boxShadow: isSelected || inMoveMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
    border: inMoveMode ? '2px solid #ff9800' : isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    ...style,
  };

  return (
    <div
      style={checkboxStyle}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onContextMenu={onContextMenu}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckChange?.(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '18px',
          height: '18px',
          margin: '0 8px 0 0',
          cursor: inMoveMode ? 'grab' : 'pointer',
          pointerEvents: inMoveMode ? 'none' : 'auto',
          accentColor: '#1a73e8',
        }}
      />
      {onLabelChange ? (
        <input
          type="text"
          value={text}
          onChange={(e) => onLabelChange(id, e.target.value)}
          style={{
            border: '1px solid #dadce0',
            borderRadius: '4px',
            padding: '8px 12px',
            marginLeft: '8px',
            fontSize: '14px',
            fontFamily: 'Roboto, Arial, sans-serif',
            color: '#202124',
            backgroundColor: '#fff',
            outline: 'none',
            flex: 1,
            minWidth: '120px',
            pointerEvents: inMoveMode ? 'none' : 'auto',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1a73e8';
            e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#dadce0';
            e.target.style.boxShadow = 'none';
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span style={{
          marginLeft: '8px',
          fontSize: '14px',
          fontFamily: 'Roboto, Arial, sans-serif',
          color: '#202124',
          lineHeight: '20px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}>{text}</span>
      )}
      {(isSelected || hover) && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#5f6368',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: inMoveMode ? 'none' : 'auto',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(95, 99, 104, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export { DraggableCheckbox };
