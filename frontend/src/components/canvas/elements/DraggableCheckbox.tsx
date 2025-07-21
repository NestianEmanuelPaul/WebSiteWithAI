import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Checkbox } from '@mui/material';
import ContextMenu from './ContextMenu';
import type { CheckboxElement } from '../../../types/element';

interface DraggableCheckboxProps extends Omit<CheckboxElement, 'type'> {
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragMove: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onUpdate: (updates: Partial<CheckboxElement>) => void;
  style?: React.CSSProperties;
}

const DraggableCheckbox: React.FC<DraggableCheckboxProps> = ({
  id,
  x,
  y,
  width = 120,
  height = 24,
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
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const elementRef = useRef<HTMLDivElement>(null);

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
    if (e.button !== 0) return; // Only left mouse button
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
      const newWidth = Math.max(120, dimensions.width + dx);
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ checked: e.target.checked });
  };

  const cursorStyle = isResizing ? 'nwse-resize' : isDragging ? 'grabbing' : 'move';

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: dimensions.width,
        height: dimensions.height,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        cursor: cursorStyle,
        zIndex,
        ...style,
      }}
    >
      <Checkbox
        checked={checked}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
        size="small"
        sx={{ padding: '4px' }}
      />
      <div
        style={{
          flex: 1,
          marginLeft: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          userSelect: 'none',
          border: isSelected ? '2px dashed #1976d2' : 'none',
          padding: '2px',
          boxSizing: 'border-box',
        }}
      >
        {label}
      </div>

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

export default DraggableCheckbox;
