import React, { useState, useRef, useEffect, useCallback } from 'react';
import ContextMenu from './ContextMenu';
import type { TextElement } from '../../../types/element';
import styles from './DraggableText.module.css';

interface DraggableTextProps extends Omit<TextElement, 'type'> {
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragMove: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onUpdate: (updates: Partial<TextElement>) => void;
  style?: React.CSSProperties;
  zIndex: number;
}

const DraggableText: React.FC<DraggableTextProps> = ({
  id,
  x,
  y,
  width = 200,
  height = 24,
  content = 'Double click to edit',
  fontSize = 16,
  color = '#000000',
  fontFamily = 'Arial, sans-serif',
  textAlign = 'left',
  isSelected,
  onSelect,
  onDelete,
  onDragMove,
  onDragEnd,
  onResize,
  onUpdate,
  zIndex,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(content);
  const [dimensions, setDimensions] = useState({ width, height });
  const elementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update internal state when content prop changes
  useEffect(() => {
    setTextContent(content);
  }, [content]);

  // Update dimensions when props change
  useEffect(() => {
    setDimensions({ width, height });
  }, [width, height]);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    onSelect();
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
    onDelete();
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditing) return; // Only left mouse button and not editing
    e.stopPropagation();
    
    setStartPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
    onSelect();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    
    if (isResizing) {
      const newWidth = Math.max(80, dimensions.width + dx);
      const newHeight = Math.max(24, dimensions.height + dy);
      setDimensions({ width: newWidth, height: newHeight });
      onResize(id, newWidth, newHeight);
    } else {
      onDragMove(id, dx, dy);
    }
    
    setStartPos({ x: e.clientX, y: e.clientY });
  }, [isDragging, isResizing, startPos, onDragMove, id, dimensions, onResize]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      onDragEnd(id);
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

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textContent !== content) {
      onUpdate({ content: textContent });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setTextContent(content);
      setIsEditing(false);
    }
  };

  const cursorStyle = isResizing ? styles.draggableTextResizing : isDragging ? styles.draggableTextDragging : '';
  const selectedClass = isSelected ? styles.selected : '';

  const dynamicClasses = [
    styles.draggableText,
    cursorStyle,
    selectedClass,
    isSelected ? styles.selected : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      className={dynamicClasses}
      style={{
        '--left': `${x}px`,
        '--top': `${y}px`,
        '--width': `${dimensions.width}px`,
        '--min-height': `${dimensions.height}px`,
        '--z-index': zIndex,
        '--font-size': `${fontSize}px`,
        '--color': color,
        '--font-family': fontFamily,
        '--text-align': textAlign,
      } as React.CSSProperties}
      data-testid="draggable-text"
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          aria-label="Edit text content"
          placeholder="Type your text here"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={styles.textInput}
          style={{ 
            fontSize: `${fontSize}px`,
            color,
            fontFamily,
            textAlign: textAlign as 'left' | 'center' | 'right' | 'justify',
            width: '100%',
            height: '100%',
          }}
        />
      ) : (
        <div 
          className={styles.textContent}
          style={{
            fontSize: `${fontSize}px`,
            color,
            fontFamily,
            textAlign: textAlign as 'left' | 'center' | 'right' | 'justify',
          }}
          dangerouslySetInnerHTML={{ __html: textContent.replace(/\n/g, '<br />') }}
        />
      )}
      {/* Resize handle */}
      {isSelected && !isResizing && (
        <div
          style={{
            position: 'absolute',
            right: -6,
            bottom: -6,
            width: 12,
            height: 12,
            backgroundColor: '#1976d2',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: zIndex + 1,
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            setStartPos({ x: e.clientX, y: e.clientY });
            onSelect();
          }}
        />
      )}
      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={handleCloseContextMenu}
        onDelete={handleDelete}
        onMove={handleMove}
        onResize={handleResize}
      />
    </div>
  );
};

export default DraggableText;
