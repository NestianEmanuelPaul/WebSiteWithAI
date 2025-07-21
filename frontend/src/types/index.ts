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

// Common properties for all elements
export interface BaseElementData {
  id: string;
  type: ElementType;
  text: string;
  x: number;
  y: number;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

// Type-specific properties
export interface ButtonElement extends BaseElementData {
  type: 'button';
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  width: number;
  height: number;
}

export interface InputElement extends BaseElementData {
  type: 'textfield' | 'textarea';
  placeholder?: string;
  value?: string;
  multiline?: boolean;
  rows?: number;
}

export interface CheckboxElement extends BaseElementData {
  type: 'checkbox';
  checked: boolean;
  label?: string;
}

export interface RadioElement extends BaseElementData {
  type: 'radio';
  checked: boolean;
  value: string;
  options?: { label: string; value: string }[];
}

export interface SelectElement extends BaseElementData {
  type: 'select';
  value: string | string[];
  options: { label: string; value: string }[];
  multiple?: boolean;
}

export interface SliderElement extends BaseElementData {
  type: 'slider';
  value: number | number[];
  min: number;
  max: number;
  step?: number;
  marks?: { value: number; label: string }[];
}

export interface SwitchElement extends BaseElementData {
  type: 'switch';
  checked: boolean;
}

export interface RatingElement extends BaseElementData {
  type: 'rating';
  value: number;
  max: number;
  precision?: number;
}

export interface TableElement extends BaseElementData {
  type: 'table';
  columns: { field: string; headerName: string; width?: number }[];
  rows: Record<string, any>[];
  pagination?: boolean;
  pageSize?: number;
}

export interface ListElement extends BaseElementData {
  type: 'list';
  items: { id: string; text: string; secondaryText?: string; icon?: string }[];
  dense?: boolean;
}

export interface CardElement extends BaseElementData {
  type: 'card';
  title: string;
  content: string;
  media?: string;
  actions?: { text: string; action: string }[];
}

export interface AlertElement extends BaseElementData {
  type: 'alert';
  severity: 'error' | 'warning' | 'info' | 'success';
  content: string;
  variant?: 'filled' | 'outlined' | 'standard';
}

export interface ProgressElement extends BaseElementData {
  type: 'progress';
  value: number;
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export interface TabsElement extends BaseElementData {
  type: 'tabs';
  tabs: { label: string; content: string }[];
  value: number;
  variant?: 'standard' | 'scrollable' | 'fullWidth';
}

export interface AccordionElement extends BaseElementData {
  type: 'accordion';
  items: { title: string; content: string; expanded?: boolean }[];
}

export interface ImageElement extends BaseElementData {
  type: 'image';
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

// Union type for all possible element data types
export type ElementData = 
  | ButtonElement
  | InputElement
  | CheckboxElement
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
  | AccordionElement
  | ImageElement
  | BaseElementData; // Fallback for simple elements
