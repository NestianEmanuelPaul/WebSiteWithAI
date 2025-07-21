import { useState, createElement } from 'react';
import type { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ComponentType } from './types';

interface ComponentRendererProps {
  component: ComponentType;
  onUpdate: (id: string, updates: Partial<ComponentType>) => void;
  onDelete: (id: string) => void;
}

export function ComponentRenderer({ component, onUpdate, onDelete }: ComponentRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(component.props?.children || '');

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: {
      type: 'component',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDoubleClick = () => {
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button'].includes(component.type)) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(component.id, {
      props: {
        ...component.props,
        children: editableContent,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(component.id);
  };

  const renderEditableContent = (tag: string) => {
    const { children, ...props } = component.props || {};
    return createElement(
      tag,
      {
        ...props,
        className: `${props.className || ''} relative group`,
        style: { ...(props.style || {}), ...style },
        onDoubleClick: handleDoubleClick,
      },
      isEditing ? (
        <input
          type="text"
          value={editableContent}
          onChange={(e) => setEditableContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full p-1 border border-blue-300 rounded bg-white"
          style={{ minWidth: '100px' }}
        />
      ) : (
        children
      )
    );
  };

  const renderButton = () => {
    const { children, ...props } = component.props || {};
    return createElement(
      'button',
      {
        ...props,
        className: `${props.className || ''} relative group`,
        style: { ...(props.style || {}), ...style },
        onDoubleClick: handleDoubleClick,
        disabled: isEditing,
      },
      isEditing ? (
        <input
          type="text"
          value={editableContent}
          onChange={(e) => setEditableContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="bg-transparent border-none outline-none w-full h-full text-black"
          style={{ minWidth: '100px' }}
        />
      ) : (
        children
      )
    );
  };

  const renderFormControl = () => {
    const { type, ...props } = component.props || {};
    return createElement(type, {
      ...props,
      className: `${props.className || ''} relative group`,
      style: { ...(props.style || {}), ...style },
      disabled: isEditing,
    });
  };

  const renderContainer = (tag: string) => {
    const { children, ...props } = component.props || {};
    return createElement(
      tag,
      {
        ...props,
        className: `${props.className || ''} relative group`,
        style: { ...(props.style || {}), ...style },
      },
      [
        ...(component.children?.map((child) => (
          <ComponentRenderer
            key={child.id}
            component={child}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )) || []),
        (!component.children || component.children.length === 0) && (
          <div 
            key="drop-zone" 
            className="text-sm text-gray-400 p-4 text-center border-2 border-dashed border-gray-200 rounded m-2"
          >
            Drop components here
          </div>
        )
      ]
    );
  };

  let renderedContent: ReactNode;

  // Handle different component types
  if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(component.type)) {
    renderedContent = renderEditableContent(component.type);
  } else if (component.type === 'button') {
    renderedContent = renderButton();
  } else if (['input', 'textarea', 'select'].includes(component.type)) {
    renderedContent = renderFormControl();
  } else if (['div', 'section', 'article', 'header', 'footer', 'aside', 'nav', 'main', 'form'].includes(component.type)) {
    renderedContent = renderContainer(component.type);
  } else if (['hr', 'br', 'img'].includes(component.type)) {
    renderedContent = createElement(component.type, {
      ...component.props,
      className: `${component.props.className || ''} relative group`,
      style: { ...component.props.style, ...style },
    });
  } else {
    // Default case
    renderedContent = (
      <div 
        {...component.props} 
        className={`${component.props.className || ''} relative group`}
        style={{ ...component.props.style, ...style }}
      >
        {component.props.children}
        {component.children?.map((child) => (
          <ComponentRenderer
            key={child.id}
            component={child}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className="relative group"
      {...attributes}
      {...listeners}
    >
      {renderedContent}
      {!isDragging && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete component"
        >
          ×
        </button>
      )}
    </div>
  );
}
