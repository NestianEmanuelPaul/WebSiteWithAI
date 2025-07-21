export interface ComponentType {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentType[];
}

export interface DraggableComponent {
  id: string;
  type: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  defaultProps?: Record<string, any>;
}

export interface DropZoneProps {
  data: ComponentType;
  onDrop: (item: any, parentId: string | null) => void;
  parentId?: string | null;
  children: React.ReactNode;
}

export interface ComponentPaletteProps {
  components: DraggableComponent[];
}

export interface CanvasProps {
  data: ComponentType;
  onUpdate: (data: ComponentType) => void;
}

export interface ComponentRendererProps {
  component: ComponentType;
  onUpdate: (id: string, updates: Partial<ComponentType>) => void;
  onDelete: (id: string) => void;
}
