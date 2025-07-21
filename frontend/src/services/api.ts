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
    console.log('Saving elements:', elements);
    
    const payload = elements.map(element => {
      // Create base element with common properties
      const baseElement: any = {
        element_id: element.id,
        element_type: element.type,
        x: Math.round(element.x),
        y: Math.round(element.y),
        properties: {
          text: (element as any).text || (element as any).label || 
                (element.type === 'button' ? 'Button' : 
                 element.type === 'checkbox' ? 'Checkbox' : 'Element'),
          ...(element as any).style
        }
      };
      
      // Add element-specific properties
      if (element.type === 'button') {
        // For buttons, include width and height in properties
        if ('width' in element) baseElement.properties.width = element.width;
        if ('height' in element) baseElement.properties.height = element.height;
      } else if (element.type === 'checkbox') {
        // For checkboxes, include checked state
        baseElement.properties.checked = (element as any).checked || false;
      }
      
      console.log('Processed element payload:', JSON.stringify(baseElement, null, 2));
      return baseElement;
    });
    
    console.log('Sending payload to server:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/elements/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      // Only try to parse as JSON, otherwise fallback to text, only once
      let errorData = null;
      let errorText = '';
      try {
        errorData = await response.json();
      } catch (e) {
        try {
          errorText = await response.text();
        } catch (e2) {
          errorText = '[unreadable response body]';
        }
      }
      const errorMessage = errorData?.detail || errorData?.message || errorText || response.statusText;
      console.error('Save failed with status:', response.status, 'Error details:', errorData || errorText);
      throw new Error(`Failed to save elements: ${response.status} ${response.statusText} - ${JSON.stringify(errorMessage)}`);
    }
    // Only read the response body once
    let responseData = null;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = null;
    }
    console.log('Elements saved successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error in saveElements:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

export const loadElements = async (): Promise<ElementData[]> => {
  try {
    console.log('Loading elements from:', `${API_BASE_URL}/elements/`);
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
    
    return Array.isArray(data) 
      ? data.map(element => {
          const baseElement: any = {
            id: element.element_id,
            type: element.element_type as ElementType,
            x: element.x || 0,
            y: element.y || 0,
            zIndex: element.properties?.zIndex || 0,
            text: element.properties?.text || element.properties?.label || (element.element_type === 'button' ? 'Button' : 'Checkbox'),
            style: {}
          };

          // Extract style properties
          if (element.properties) {
            const { text, label, checked, width, height, ...style } = element.properties;
            baseElement.style = style;
            
            // Add button-specific properties
            if (element.element_type === 'button') {
              if (width !== undefined) baseElement.width = width;
              if (height !== undefined) baseElement.height = height;
            }
            
            // Add checkbox-specific properties
            if (element.element_type === 'checkbox') {
              baseElement.checked = checked || false;
            }
          }
          
          return baseElement as ElementData;
        })
      : [];
  } catch (error) {
    console.error('Error in loadElements:', error);
    throw error;
  }
};
