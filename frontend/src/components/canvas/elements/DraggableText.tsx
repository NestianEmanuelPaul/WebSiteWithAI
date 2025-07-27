import React, { useState, useRef, useEffect, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
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
  
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(content);
  const [dimensions, setDimensions] = useState({ width, height });
  const [textAreaHeight, setTextAreaHeight] = useState('auto');
  const elementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Update internal state when content prop changes
  useEffect(() => {
    setTextContent(content);
  }, [content]);

  // Update dimensions when props change
  useEffect(() => {
    setDimensions({ width, height });
  }, [width, height]);

  const handleDelete = () => {
    onDelete();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (e.target as HTMLTextAreaElement).blur();
    } else if (e.key === 'Escape') {
      setTextContent(content);
      setIsEditing(false);
    }
    
    // Auto-grow the textarea
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 500)}px`; // Limit max height to 500px
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
        <textarea
          ref={inputRef}
          aria-label="Edit text content"
          placeholder="Type your text here"
          value={textContent}
          onChange={(e) => {
            setTextContent(e.target.value);
            // Auto-grow the textarea
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 500)}px`; // Limit max height to 500px
          }}
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
            minHeight: '100%',
            resize: 'none',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            overflow: 'hidden',
            overflowY: 'auto',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '2px',
            boxSizing: 'border-box',
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
            width: '100%',
            height: '100%',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: textContent.replace(/\n/g, '<br />') }}
        />
      )}
      {/* Resize handle */}
      {isSelected && onDelete && !isEditing && (
        <IconButton
          size="small"
          onClick={(e)=>{e.stopPropagation();handleDelete();}}
          sx={{position:'absolute',top:0,right:0,backgroundColor:'rgba(255,255,255,0.8)','&:hover':{backgroundColor:'rgba(255,0,0,0.2)'}}}
        >
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      )}
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

    </div>
  );
};

export default DraggableText;
