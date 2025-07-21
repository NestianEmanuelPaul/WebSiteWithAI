import { useDroppable } from '@dnd-kit/core';
import type { ComponentType } from './types';
import { ComponentRenderer } from './ComponentRenderer.js';

interface CanvasProps {
  data: ComponentType;
  onUpdate: (id: string, updates: Partial<ComponentType>) => void;
  onDelete: (id: string) => void;
}

export function Canvas({ data, onUpdate, onDelete }: CanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas',
    data: {
      isCanvas: true,
    },
  });

  const handleUpdate = (id: string, updates: Partial<ComponentType>) => {
    onUpdate(id, updates);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  return (
    <div
      ref={setNodeRef}
      className="min-h-[80vh] p-4 border-2 border-dashed border-gray-300 rounded-lg"
      style={data.props?.style || {}}
    >
      {data.children?.length ? (
        data.children.map((child) => (
          <ComponentRenderer
            key={child.id}
            component={child}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))
      ) : (
        <div className="text-center text-gray-400 p-8">
          Drag and drop components here
        </div>
      )}
    </div>
  );
}
