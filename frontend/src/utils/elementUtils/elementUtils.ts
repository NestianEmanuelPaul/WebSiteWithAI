import { v4 as uuidv4 } from 'uuid';
import type { 
  ElementType, 
  ElementData, 
  ButtonElement, 
  CheckboxElement, 
  TextElement,
  ImageElement,
  Position,
  Size
} from '../types/element';

// Type guards
export const isButtonElement = (element: ElementData): element is ButtonElement => 
  element.type === 'button';

export const isCheckboxElement = (element: ElementData): element is CheckboxElement => 
  element.type === 'checkbox';

export const isTextElement = (element: ElementData): element is TextElement => 
  element.type === 'text';

export const isImageElement = (element: ElementData): element is ImageElement =>
  element.type === 'image';

// Default element dimensions
const DEFAULT_ELEMENT_SIZE: Record<ElementType, Size> = {
  button: { width: 120, height: 40 },
  checkbox: { width: 150, height: 24 },
  text: { width: 200, height: 40 },
  image: { width: 200, height: 150 }
};

// Helper to create base element properties
const createBaseElement = <T extends ElementType>(
  type: T, 
  position: Position, 
  size: Size
): Omit<ElementData, 'type'> & { type: T } => ({
  id: uuidv4(),
  type,
  x: position.x,
  y: position.y,
  zIndex: 1,
  locked: false,
  width: size.width,
  height: size.height,
  metadata: {}
});

// Helper to create button element
const createButtonElement = (
  base: Omit<ElementData, 'type'>,
  overrides: Partial<Omit<ButtonElement, 'id' | 'type'>> = {}
): ButtonElement => ({
  ...base,
  type: 'button',
  text: 'Button',
  variant: 'contained',
  color: 'primary',
  onClick: () => {},
  ...overrides
});

// Helper to create checkbox element
const createCheckboxElement = (
  base: Omit<ElementData, 'type'>,
  overrides: Partial<Omit<CheckboxElement, 'id' | 'type'>> = {}
): CheckboxElement => ({
  ...base,
  type: 'checkbox',
  label: 'Checkbox',
  checked: false,
  onChange: () => {},
  ...overrides
});

// Helper to create text element
const createTextElement = (
  base: Omit<ElementData, 'type'>,
  overrides: Partial<Omit<TextElement, 'id' | 'type'>> = {}
): TextElement => ({
  ...base,
  type: 'text',
  content: 'Text',
  fontSize: 16,
  fontFamily: 'Arial',
  textAlign: 'left',
  color: '#000000',
  ...overrides
});

// Helper to create image element
const createImageElement = (
  base: Omit<ElementData, 'type'>,
  overrides: Partial<Omit<ImageElement, 'id' | 'type'>> = {}
): ImageElement => ({
  ...base,
  type: 'image',
  src: '',
  alt: 'Image',
  objectFit: 'contain',
  ...overrides
});

// Element creators
export function createNewElement<T extends ElementType>(
  type: T,
  position: Position,
  overrides: Partial<Omit<Extract<ElementData, { type: T }>, 'id' | 'type'>> = {}
): Extract<ElementData, { type: T }> {
  const baseElement = createBaseElement(type, position, DEFAULT_ELEMENT_SIZE[type]);
  
  // Remove type from base element to avoid conflicts
  const { type: _, ...base } = baseElement;
  
  switch (type) {
    case 'button':
      return createButtonElement(base, overrides as any) as any;
    
    case 'checkbox':
      return createCheckboxElement(base, overrides as any) as any;
    
    case 'text':
      return createTextElement(base, overrides as any) as any;
      
    case 'image':
      return createImageElement(base, overrides as any) as any;
      
    default:
      // This ensures all cases are handled
      const _exhaustiveCheck: never = type;
      throw new Error(`Unsupported element type: ${type}`);
  }
};

// Helper to update element properties
export const updateElement = <T extends ElementData>(
  element: T,
  updates: Partial<Omit<T, 'id' | 'type'>>
): T => {
  // Create a new object with the updated properties
  const updatedElement = {
    ...element,
    ...updates,
    // Preserve metadata if it exists, otherwise initialize it
    metadata: {
      ...(element.metadata || {}),
      ...(updates.metadata || {})
    }
  };

  return updatedElement as T;
};

// Helper to validate element data
export const validateElement = (element: unknown): element is ElementData => {
  if (!element || typeof element !== 'object') return false;
  
  const el = element as Record<string, unknown>;
  
  // Check required base properties
  if (typeof el.id !== 'string' || 
      typeof el.type !== 'string' ||
      typeof el.x !== 'number' ||
      typeof el.y !== 'number' ||
      typeof el.width !== 'number' ||
      typeof el.height !== 'number') {
    return false;
  }
  
  // Check optional base properties
  if ((el.zIndex !== undefined && typeof el.zIndex !== 'number') ||
      (el.locked !== undefined && typeof el.locked !== 'boolean') ||
      (el.metadata !== undefined && (typeof el.metadata !== 'object' || el.metadata === null))) {
    return false;
  }
  
  // Type-specific validation
  switch (el.type) {
    case 'button': {
      const button = el as ButtonElement;
      return typeof button.text === 'string' &&
             ['text', 'contained', 'outlined'].includes(button.variant || 'contained') &&
             ['primary', 'secondary', 'success', 'error', 'info', 'warning'].includes(button.color || 'primary') &&
             (button.onClick === undefined || typeof button.onClick === 'function');
    }
              
    case 'checkbox': {
      const checkbox = el as CheckboxElement;
      return typeof checkbox.label === 'string' &&
             typeof checkbox.checked === 'boolean' &&
             (checkbox.onChange === undefined || typeof checkbox.onChange === 'function');
    }
              
    case 'text': {
      const text = el as TextElement;
      return typeof text.content === 'string' &&
             typeof text.fontSize === 'number' &&
             typeof text.fontFamily === 'string' &&
             typeof text.color === 'string' &&
             ['left', 'center', 'right', 'justify'].includes(text.textAlign || 'left');
    }
              
    case 'image': {
      const image = el as ImageElement;
      return typeof image.src === 'string' &&
             typeof image.alt === 'string' &&
             ['contain', 'cover', 'fill', 'none', 'scale-down'].includes(image.objectFit || 'contain');
    }
              
    default:
      return false;
  }
};
