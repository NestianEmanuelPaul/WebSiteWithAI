import React, { useState, useEffect, useCallback } from 'react';

interface DraggableTextProps {
  id: string;
  x: number;
  y: number;
  text: string;
  isSelected: boolean;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  onClick: (e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onDragMove?: (id: string, dx: number, dy: number) => void;
  onDragEnd?: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  inMoveMode?: boolean;
}

const DraggableText: React.FC<DraggableTextProps> = ({
  id,
  x,
  y,
  text,
  isSelected,
  style = {},
  width = 'auto',
  onClick,
  onDelete,
  onTextChange = () => {},
  onDragMove = () => {},
  onDragEnd = () => {},
  onContextMenu = () => {},
  inMoveMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle mouse movement during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && onDragMove) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onDragMove(id, dx, dy);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, onDragMove, id, dragStart.x, dragStart.y]);
  
  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      onDragEnd(id);
    }
  }, [isDragging, onDragEnd, id]);
  
  // Set up and clean up event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update local text when prop changes
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Handle click to select the element
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  // Handle mouse down for dragging or selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (inMoveMode) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      onClick(e);
    }
  };

  // Handle double click to start editing
  const handleDoubleClick = () => {
    if (!inMoveMode) {
      setIsEditing(true);
    }
  };

  // Handle blur to save changes
  const handleBlur = () => {
    setIsEditing(false);
    onTextChange(id, localText);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onTextChange(id, localText);
    } else if (e.key === 'Escape') {
      setLocalText(text);
      setIsEditing(false);
    }
  };

  // Styles for the text element
  const textFieldStyles: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: typeof width === 'number' ? `${width}px` : width,
    minWidth: '120px',
    backgroundColor: isSelected ? 'rgba(26, 115, 232, 0.08)' : 'transparent',
    border: isSelected
      ? '1px dashed #1a73e8'
      : inMoveMode
        ? '1px dashed #ff9e2d'
        : '1px solid transparent',
    borderRadius: '4px',
    padding: '4px',
    cursor: inMoveMode ? 'grab' : 'text',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'Roboto, Arial, sans-serif',
    ...style,
  };

  return (
    <div
      style={textFieldStyles}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
    >
      {isEditing ? (
        <input
          type="text"
          aria-label="Edit text"
          placeholder="Enter text here"
          autoFocus
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            fontFamily: 'Roboto, Arial, sans-serif',
            color: '#202124',
            backgroundColor: '#fff',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1a73e8';
            e.target.style.boxShadow = '0 0 0 2px rgba(26, 115, 232, 0.2)';
          }}
          onBlur={(e) => {
            handleBlur();
            e.target.style.borderColor = '#dadce0';
            e.target.style.boxShadow = 'none';
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '8px 12px',
            fontSize: '14px',
            fontFamily: 'Roboto, Arial, sans-serif',
            color: style.color || '#202124',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            borderRadius: '4px',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {text || 'Double click to edit text'}
        </div>
      )}

      {(isSelected || isHovered) && onDelete && !isEditing && (
        <button
          aria-label="Delete text element"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#5f6368',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            pointerEvents: inMoveMode ? 'none' : 'auto',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(95, 99, 104, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}

      {inMoveMode && (
        <div
          style={{
            position: 'absolute',
            right: '4px',
            bottom: 0,
            transform: 'translateY(100%)',
            backgroundColor: '#ff9e2d',
            color: 'white',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '0 0 4px 4px',
            whiteSpace: 'nowrap',
            fontFamily: 'Roboto, Arial, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.25px',
          }}
        >
          Move Mode Active
        </div>
      )}
    </div>
  );
};

export default DraggableText;
