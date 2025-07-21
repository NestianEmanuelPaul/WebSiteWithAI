import { useState, useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { ComponentType, DraggableComponent } from './types';
import { ComponentPalette } from './ComponentPalette.js';
import { Canvas } from './Canvas.js';
import { v4 as uuidv4 } from 'uuid';

const defaultComponents: DraggableComponent[] = [
  // Layout Components
  {
    id: 'container',
    type: 'div',
    name: 'Container',
    description: 'A container for other components',
    icon: '📦',
    category: 'Layout',
    defaultProps: {
      className: 'p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-20',
      style: { minHeight: '5rem' }
    }
  },
  {
    id: 'section',
    type: 'section',
    name: 'Section',
    description: 'A section with padding and background',
    icon: '📑',
    category: 'Layout',
    defaultProps: {
      className: 'p-6 bg-white rounded-lg shadow-sm',
      style: { minHeight: '8rem' }
    }
  },
  {
    id: 'grid',
    type: 'div',
    name: 'Grid',
    description: 'A responsive grid layout',
    icon: '🔲',
    category: 'Layout',
    defaultProps: {
      className: 'grid grid-cols-2 gap-4 p-4',
      style: { minHeight: '8rem' }
    }
  },
  
  // Basic Components
  {
    id: 'button',
    type: 'button',
    name: 'Button',
    description: 'A clickable button',
    icon: '🔘',
    category: 'Basic',
    defaultProps: {
      children: 'Click me',
      className: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200',
      style: { cursor: 'pointer' }
    }
  },
  {
    id: 'text',
    type: 'p',
    name: 'Text',
    description: 'Editable text content',
    icon: '📝',
    category: 'Basic',
    defaultProps: {
      children: 'Double click to edit this text',
      className: 'text-gray-800 leading-relaxed',
      style: { margin: '0.5rem 0' }
    }
  },
  {
    id: 'heading',
    type: 'h2',
    name: 'Heading',
    description: 'Section heading',
    icon: '🔤',
    category: 'Basic',
    defaultProps: {
      children: 'Section Title',
      className: 'text-2xl font-bold text-gray-900 mb-4'
    }
  },
  
  // Form Elements
  {
    id: 'input',
    type: 'input',
    name: 'Input',
    description: 'Text input field',
    icon: '📝',
    category: 'Form',
    defaultProps: {
      type: 'text',
      placeholder: 'Enter text here...',
      className: 'w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      style: { minWidth: '200px' }
    }
  },
  {
    id: 'textarea',
    type: 'textarea',
    name: 'Text Area',
    description: 'Multi-line text input',
    icon: '📄',
    category: 'Form',
    defaultProps: {
      placeholder: 'Enter your message here...',
      className: 'w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      rows: 3,
      style: { minWidth: '200px' }
    }
  },
  {
    id: 'select',
    type: 'select',
    name: 'Select',
    description: 'Dropdown selection',
    icon: '🔽',
    category: 'Form',
    defaultProps: {
      className: 'w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      children: [
        { type: 'option', props: { value: '', children: 'Select an option...' } },
        { type: 'option', props: { value: '1', children: 'Option 1' } },
        { type: 'option', props: { value: '2', children: 'Option 2' } },
        { type: 'option', props: { value: '3', children: 'Option 3' } }
      ],
      style: { minWidth: '200px' }
    }
  },
  
  // Media
  {
    id: 'image',
    type: 'img',
    name: 'Image',
    description: 'Image placeholder',
    icon: '🖼️',
    category: 'Media',
    defaultProps: {
      src: 'https://via.placeholder.com/300x200',
      alt: 'Placeholder image',
      className: 'max-w-full h-auto rounded',
      style: { maxWidth: '100%' }
    }
  },
  {
    id: 'divider',
    type: 'hr',
    name: 'Divider',
    description: 'Horizontal line',
    icon: '➖',
    category: 'Layout',
    defaultProps: {
      className: 'my-4 border-t border-gray-200',
      style: { width: '100%' }
    }
  }
];

export function Editor() {
  const [components] = useState<DraggableComponent[]>(defaultComponents);
  const [canvas, setCanvas] = useState<ComponentType>({
    id: 'root',
    type: 'div',
    props: {
      className: 'min-h-screen p-4 bg-gray-50'
    },
    children: []
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setCanvas((prevCanvas) => {
        const newCanvas = { ...prevCanvas };
        const activeComponent = defaultComponents.find((c: DraggableComponent) => `component-${c.id}` === active.id);
        
        if (activeComponent) {
          const newComponent: ComponentType = {
            id: `comp-${uuidv4()}`,
            type: activeComponent.type,
            props: { ...activeComponent.defaultProps },
            children: []
          };
          
          if (!newCanvas.children) {
            newCanvas.children = [];
          }
          
          return {
            ...newCanvas,
            children: [...newCanvas.children, newComponent]
          };
        }
        
        return newCanvas;
      });
    }
  }, [components]);

  const updateComponent = useCallback((id: string, updates: Partial<ComponentType>) => {
    setCanvas(prevCanvas => {
      const updateComponentInTree = (component: ComponentType): ComponentType => {
        if (component.id === id) {
          return { ...component, ...updates };
        }

        if (component.children) {
          return {
            ...component,
            children: component.children.map(updateComponentInTree)
          };
        }

        return component;
      };

      return updateComponentInTree(prevCanvas);
    });
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setCanvas(prevCanvas => {
      const deleteFromTree = (component: ComponentType): ComponentType | null => {
        if (component.id === id) {
          return null;
        }

        if (component.children) {
          return {
            ...component,
            children: component.children
              .map(deleteFromTree)
              .filter(Boolean) as ComponentType[]
          };
        }

        return component;
      };

      const newCanvas = deleteFromTree(prevCanvas);
      return newCanvas || { id: 'root', type: 'div', props: {}, children: [] };
    });
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Components</h2>
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <SortableContext 
            items={defaultComponents.map((c: DraggableComponent) => `component-${c.id}`)} 
            strategy={rectSortingStrategy}
          >
            <ComponentPalette components={defaultComponents} />
          </SortableContext>
        </DndContext>
      </div>
      
      <div className="flex-1 p-4 overflow-auto bg-gray-100">
        <h2 className="text-lg font-semibold mb-4">Canvas</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <Canvas 
            data={canvas} 
            onUpdate={updateComponent}
            onDelete={deleteComponent}
          />
        </div>
      </div>
      
      <div className="w-64 border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        <div className="text-gray-500 text-sm">
          Select a component to edit its properties
        </div>
      </div>
    </div>
  );
}
