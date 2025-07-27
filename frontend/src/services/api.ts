import type { ElementData, ElementType } from '../types/element';

const API_BASE_URL = '/api/v1';

export interface ApiElement {
  id: number;
  element_id: string;
  element_type: ElementType;
  x: number;
  y: number;
  properties: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const saveElements = async (elements: ElementData[]): Promise<void> => {
  try {
    console.group('Saving elements');
    console.log('Input elements:', JSON.parse(JSON.stringify(elements)));
    
    const payload = elements.map(element => {
      // Create a clean copy of the element with only necessary properties
      const { id, type, x, y, width, height, ...rest } = element;
      
      const baseElement: any = {
        element_id: id,
        element_type: type,
        x: Math.round(x),
        y: Math.round(y),
        properties: {
          width,
          height,
          ...rest,
          // Add type-specific defaults
          text: (element as any).text || (element as any).label || 
                (type === 'button' ? 'Button' : 
                 type === 'checkbox' ? 'Checkbox' : 'Element')
        }
      };

      // Clean up any undefined values in properties
      Object.keys(baseElement.properties).forEach(key => {
        if (baseElement.properties[key] === undefined) {
          delete baseElement.properties[key];
        }
      });
      
      console.log(`Processed element ${element.id}:`, JSON.parse(JSON.stringify(baseElement)));
      return baseElement;
    });

    console.log('Final payload being sent to server:', JSON.parse(JSON.stringify(payload)));
    
    const response = await fetch(`${API_BASE_URL}/elements/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Save failed with status:', response.status, 'Error:', errorData);
      throw new Error(`Failed to save elements: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Save successful, server response:', result);
    console.groupEnd();
    return result;
  } catch (error) {
    console.error('Error in saveElements:', error);
    console.groupEnd();
    throw error;
  }
};

export const loadElements = async (): Promise<ElementData[]> => {
  try {
    console.group('Loading elements');
    console.log('Fetching elements from:', `${API_BASE_URL}/elements/`);
    
    const response = await fetch(`${API_BASE_URL}/elements/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Load failed with status:', response.status, 'Error:', errorData);
      throw new Error(`Failed to load elements: ${response.status} ${response.statusText}`);
    }

    const data: ApiElement[] = await response.json();
    console.log('Raw data from server:', JSON.parse(JSON.stringify(data)));
    
    const processedElements = Array.isArray(data) 
      ? data.map(element => {
          const baseElement: any = {
            id: element.element_id,
            type: element.element_type,
            x: element.x || 0,
            y: element.y || 0,
            width: element.properties?.width || 150,
            height: element.properties?.height || 40,
            ...element.properties
          };
          
          console.log(`Processed element ${element.element_id}:`, JSON.parse(JSON.stringify(baseElement)));
          return baseElement as ElementData;
        })
      : [];
    
    console.log('Final processed elements:', JSON.parse(JSON.stringify(processedElements)));
    console.groupEnd();
    return processedElements;
  } catch (error) {
    console.error('Error in loadElements:', error);
    console.groupEnd();
    throw error;
  }
};
