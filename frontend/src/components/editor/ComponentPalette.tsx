import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableComponent } from './types';

interface ComponentItemProps {
  component: DraggableComponent;
  disabled?: boolean;
}

function ComponentItem({ component, disabled = false }: ComponentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `component-${component.id}`,
    data: {
      type: 'component',
      component,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'grab',
    filter: disabled ? 'grayscale(100%)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-2 mb-2 bg-white rounded border ${
        disabled ? 'border-gray-200' : 'border-blue-200 hover:border-blue-400'
      } shadow-sm hover:shadow-md transition-all`}
      {...attributes}
      {...(disabled ? {} : listeners)}
    >
      <span className="text-xl mr-2">{component.icon}</span>
      <div className="flex-1">
        <div className="font-medium">{component.name}</div>
        {component.description && (
          <div className="text-xs text-gray-500">{component.description}</div>
        )}
      </div>
    </div>
  );
}

interface ComponentPaletteProps {
  components: DraggableComponent[];
}

export function ComponentPalette({ components }: ComponentPaletteProps) {
  const categories = [...new Set(components.map(comp => comp.category))];

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category} className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">
            {category}
          </h3>
          <div className="space-y-2">
            {components
              .filter(comp => comp.category === category)
              .map(component => (
                <ComponentItem key={component.id} component={component} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
