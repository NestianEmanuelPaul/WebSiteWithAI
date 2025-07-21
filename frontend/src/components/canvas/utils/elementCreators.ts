import { v4 as uuidv4 } from 'uuid';
import type { 
  ElementData, 
  ButtonElement, 
  CheckboxElement, 
  TextElement, 
  ImageElement 
} from '../../../types/element';

export const createButtonElement = (x: number = 100, y: number = 100): ButtonElement => ({
  id: uuidv4(),
  type: 'button',
  x,
  y,
  width: 120,
  height: 40,
  zIndex: 0,
  text: 'Button',
  variant: 'contained',
  color: 'primary',
  onClick: () => {}
});

export const createCheckboxElement = (x: number = 100, y: number = 100): CheckboxElement => ({
  id: uuidv4(),
  type: 'checkbox',
  x,
  y,
  width: 120,
  height: 40,
  zIndex: 0,
  label: 'Checkbox',
  checked: false,
  onChange: () => {}
});

export const createTextElement = (x: number = 100, y: number = 100): TextElement => ({
  id: uuidv4(),
  type: 'text',
  x,
  y,
  width: 200,
  height: 40,
  zIndex: 0,
  content: 'Double click to edit',
  fontSize: 16,
  color: '#000000',
  fontFamily: 'Arial',
  textAlign: 'left'
});

export const createImageElement = (x: number = 100, y: number = 100): ImageElement => ({
  id: uuidv4(),
  type: 'image',
  x,
  y,
  width: 200,
  height: 150,
  zIndex: 0,
  src: '',
  alt: 'Image',
  objectFit: 'contain'
});

export const createNewElement = (type: string, x: number = 100, y: number = 100): ElementData => {
  switch (type) {
    case 'button':
      return createButtonElement(x, y);
    case 'checkbox':
      return createCheckboxElement(x, y);
    case 'text':
      return createTextElement(x, y);
    case 'image':
      return createImageElement(x, y);
    default:
      throw new Error(`Unsupported element type: ${type}`);
  }
};

// Type guard functions for element types
export const isButtonElement = (element: ElementData): element is ButtonElement => 
  element.type === 'button';

export const isCheckboxElement = (element: ElementData): element is CheckboxElement => 
  element.type === 'checkbox';

export const isTextElement = (element: ElementData): element is TextElement => 
  element.type === 'text';

export const isImageElement = (element: ElementData): element is ImageElement => 
  element.type === 'image';
