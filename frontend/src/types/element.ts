// Base element types
export type ElementType = 
  // Basic Elements
  | 'button' | 'link' | 'text' | 'heading' | 'paragraph' | 'divider'
  // Form Inputs
  | 'textfield' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'slider' | 'switch'
  | 'datepicker' | 'timepicker' | 'datetimepicker' | 'fileupload' | 'rating'
  // Navigation
  | 'menu' | 'tabs' | 'breadcrumbs' | 'pagination' | 'stepper'
  // Data Display
  | 'table' | 'list' | 'card' | 'chip' | 'badge' | 'tooltip' | 'accordion'
  // Feedback
  | 'alert' | 'progress' | 'snackbar' | 'dialog'
  // Media
  | 'image' | 'video' | 'audio' | 'avatar'
  // Layout
  | 'container' | 'grid' | 'paper' | 'box' | 'stack';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseElementData {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  style?: React.CSSProperties;
  data?: Record<string, any>;
}

// Button Element
export interface ButtonElement extends BaseElementData {
  type: 'button';
  text: string;
  variant?: 'text' | 'contained' | 'outlined';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  onClick?: () => void;
}

// Checkbox Element
export interface CheckboxElement extends BaseElementData {
  type: 'checkbox';
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

// Text Element
export interface TextElement extends BaseElementData {
  type: 'text';
  content: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
}

// Image Element
export interface ImageElement extends BaseElementData {
  type: 'image';
  src: string;
  alt: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

// Input Element
export interface InputElement extends BaseElementData {
  type: 'textfield' | 'textarea';
  placeholder?: string;
  value?: string;
  multiline?: boolean;
  rows?: number;
}

// Radio Element
export interface RadioElement extends BaseElementData {
  type: 'radio';
  checked: boolean;
  value: string;
  options?: { label: string; value: string }[];
  onChange?: (value: string) => void;
}

// Select Element
export interface SelectElement extends BaseElementData {
  type: 'select';
  value: string | string[];
  options: { label: string; value: string }[];
  multiple?: boolean;
  onChange?: (value: string | string[]) => void;
}

// Slider Element
export interface SliderElement extends BaseElementData {
  type: 'slider';
  value: number | number[];
  min: number;
  max: number;
  step?: number;
  marks?: { value: number; label: string }[];
  onChange?: (value: number | number[]) => void;
}

// Switch Element
export interface SwitchElement extends BaseElementData {
  type: 'switch';
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

// Rating Element
export interface RatingElement extends BaseElementData {
  type: 'rating';
  value: number;
  max: number;
  precision?: number;
  onChange?: (value: number) => void;
}

// Table Element
export interface TableElement extends BaseElementData {
  type: 'table';
  columns: { field: string; headerName: string; width?: number }[];
  rows: Record<string, any>[];
  pagination?: boolean;
  pageSize?: number;
}

// List Element
export interface ListElement extends BaseElementData {
  type: 'list';
  items: { id: string; text: string; secondaryText?: string; icon?: string }[];
  dense?: boolean;
}

// Card Element
export interface CardElement extends BaseElementData {
  type: 'card';
  title: string;
  content: string;
  media?: string;
  actions?: { text: string; action: string }[];
}

// Alert Element
export interface AlertElement extends BaseElementData {
  type: 'alert';
  severity: 'error' | 'warning' | 'info' | 'success';
  content: string;
  variant?: 'filled' | 'outlined' | 'standard';
  onClose?: () => void;
}

// Progress Element
export interface ProgressElement extends BaseElementData {
  type: 'progress';
  value: number;
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

// Tabs Element
export interface TabsElement extends BaseElementData {
  type: 'tabs';
  tabs: { label: string; content: string }[];
  value: number;
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  onChange?: (event: React.SyntheticEvent, newValue: number) => void;
}

// Accordion Element
export interface AccordionElement extends BaseElementData {
  type: 'accordion';
  items: { title: string; content: string; expanded?: boolean }[];
}

// Union type for all possible element data types
export type ElementData = 
  | ButtonElement
  | CheckboxElement
  | TextElement
  | ImageElement
  | InputElement
  | RadioElement
  | SelectElement
  | SliderElement
  | SwitchElement
  | RatingElement
  | TableElement
  | ListElement
  | CardElement
  | AlertElement
  | ProgressElement
  | TabsElement
  | AccordionElement;

export interface ElementUpdate<T extends ElementData> {
  id: string;
  updates: Partial<Omit<T, 'id' | 'type'>>;
}

export interface ElementProps<T extends ElementData> {
  element: T;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<T>) => void;
  onDelete: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}
