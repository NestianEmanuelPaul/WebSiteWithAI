import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Menu, MenuItem, Button, Snackbar, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DraggableButton from './elements/DraggableButton';
import DraggableCheckbox from './elements/DraggableCheckbox';
import DraggableText from './elements/DraggableText';
import type { ElementData, ElementType, CheckboxElement } from '../../types/element';
import { saveElements, loadElements } from '../../services/api';

const GRID_SIZE = 2; // Smaller grid size for precise snapping

interface CanvasProps {
  initialElements?: ElementData[];
  onSave?: (elements: ElementData[]) => void;
  onElementDragStart?: (type: ElementType) => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  initialElements = [], 
  onSave,
  onElementDragStart 
}) => {
  const [elements, setElements] = useState<ElementData[]>(initialElements);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    elementId: string | null;
  } | null>(null);
  const [mode, setMode] = useState<'none' | 'move' | 'resize'>('none');
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ open: boolean; success: boolean; message: string }>({
    open: false,
    success: false,
    message: ''
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load saved elements on component mount
  useEffect(() => {
    const fetchSavedElements = async () => {
      try {
        const savedElements = await loadElements();
        if (savedElements.length > 0) {
          setElements(savedElements);
          console.log('Loaded saved elements:', savedElements);
        }
      } catch (error) {
        console.error('Error loading saved elements:', error);
        setSaveStatus({
          open: true,
          success: false,
          message: 'Failed to load saved elements.'
        });
      }
    };

    fetchSavedElements();
  }, []);

  // Handle elements change and trigger onSave callback
  const handleElementsChange = useCallback((newElements: ElementData[]) => {
    setElements(newElements);
    if (onSave) {
      onSave(newElements);
    }
  }, [onSave]);

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset any visual feedback
    if (canvasRef.current) {
      canvasRef.current.style.borderColor = 'red';
    }
    
    // Debug: Log all available data transfer types and their contents
    const dataTypes = Array.from(e.dataTransfer.types);
    console.log('Available data transfer types:', dataTypes);
    
    // Try to get the element type from the drag event
    let type: ElementType | null = null;
    
    // Check all possible data types we might receive
    for (const dataType of dataTypes) {
      try {
        const data = e.dataTransfer.getData(dataType);
        console.log(`Data for type '${dataType}':`, data);
        
        // Check if this is one of our expected element types
        if (['button', 'checkbox', 'text'].includes(data)) {
          type = data as ElementType;
          console.log('Found valid element type:', type);
          break;
        }
      } catch (err) {
        console.warn(`Error reading data type '${dataType}':`, err);
      }
    }
    
    if (!type) {
      console.error('No valid element type found in drop data. Available types:', dataTypes);
      return;
    }

    // Notify parent component about the drag start (for analytics or other purposes)
    if (onElementDragStart) {
      onElementDragStart(type);
    }

    // Get the canvas position
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) {
      console.error('Could not get canvas bounds');
      return;
    }

    // Calculate position relative to the canvas
    const x = e.clientX - canvasRect.left - window.scrollX;
    const y = e.clientY - canvasRect.top - window.scrollY;
    
    console.log('Drop coordinates - X:', x, 'Y:', y, 'ClientX:', e.clientX, 'ClientY:', e.clientY);

    // Create a new element with default properties
    const defaultProps: Partial<Record<ElementType, Partial<ElementData>>> = {
      button: {
        variant: 'contained',
        color: 'primary',
        text: 'Button',
        width: 120,
        height: 36,
      },
      checkbox: {
        label: 'Checkbox',
        checked: false,
        width: 120,
        height: 24,
      },
      text: {
        content: 'Double click to edit',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'left',
        width: 200,
        height: 24,
      },
      image: {
        src: '',
        alt: 'Image',
        width: 150,
        height: 150,
      },
    };

    const newElement: ElementData = {
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      x,
      y,
      zIndex: 1,
      ...defaultProps[type],
    } as ElementData;

    console.log('Adding new element:', newElement);
    
    // Add the new element to the canvas
    const newElements = [...elements, newElement];
    handleElementsChange(newElements);
    
    // Select the new element
    setSelectedElementId(newElement.id);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Add a visual indicator that we're over a drop target
    if (canvasRef.current) {
      canvasRef.current.style.borderColor = 'green';
      canvasRef.current.style.borderStyle = 'dashed';
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (canvasRef.current) {
      canvasRef.current.style.borderColor = 'red';
      canvasRef.current.style.borderStyle = 'dashed';
    }
  };

  // Function to update an element's properties
  const updateElement = useCallback((elementId: string, updates: Partial<Omit<ElementData, 'id' | 'type'>>) => {
    console.log('Updating element:', { elementId, updates });
    setElements(prevElements => 
      prevElements.map(el => {
        if (el.id === elementId) {
          const updated = { ...el, ...updates };
          console.log('Element updated:', updated);
          return updated;
        }
        return el;
      })
    );
  }, []);

  // Delete an element
  const deleteElement = (id: string) => {
    handleElementsChange(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Handle canvas click to deselect elements
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (mode === 'move' && selectedElementId && mousePosition) {
      e.preventDefault();
      e.stopPropagation();
      
      // Update the element's position
      updateElement(selectedElementId, { 
        x: mousePosition.x, 
        y: mousePosition.y 
      });
      
      // Exit move mode
      setMode('none');
      setMousePosition(null);
    } else if (e.target === e.currentTarget) {
      setSelectedElementId(null);
    }
  }, [mode, selectedElementId, mousePosition]);

  // Handle mouse move for crosshair
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode === 'move') {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        setMousePosition({
          x: e.clientX - canvasRect.left,
          y: e.clientY - canvasRect.top
        });
      }
    }
  }, [mode]);

  // Handle context menu
  const handleContextMenu = useCallback((event: React.MouseEvent, elementId: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            elementId,
          }
        : null,
    );
  }, [contextMenu]);

  const handleClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Update handleContextMenuAction to handle move mode
  const handleContextMenuAction = useCallback((action: 'move' | 'resize') => {
    if (!contextMenu?.elementId) return;
    
    if (action === 'move') {
      setMode('move');
      setSelectedElementId(contextMenu.elementId);
      
      // Set initial mouse position to the element's position
      const element = elements.find(el => el.id === contextMenu.elementId);
      if (element) {
        setMousePosition({
          x: element.x,
          y: element.y
        });
      }
    } else if (action === 'resize') {
      // Handle resize logic here
      console.log('Resize element', contextMenu.elementId);
    }
    
    handleClose();
  }, [contextMenu, elements, handleClose]);

  // Save elements to the server
  const handleSave = useCallback(async () => {
    console.log('Saving elements:', elements);
    try {
      await saveElements(elements);
      console.log('Elements saved successfully');
    } catch (error) {
      console.error('Failed to save elements:', error);
    }
  }, [elements]);

  // Handle close of the snackbar
  const handleCloseSnackbar = () => {
    setSaveStatus(prev => ({ ...prev, open: false }));
  };

  // Add grid styles with smaller grid size
  const gridStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`, // Smaller grid size
    pointerEvents: 'none' as const,
    opacity: mode === 'move' ? 1 : 0,
    transition: 'opacity 0.2s',
    zIndex: 999
  };

  // Add crosshair styles
  const crosshairStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    zIndex: 1000,
    display: mode === 'move' && mousePosition ? 'block' : 'none',
  };

  const verticalLine = {
    position: 'absolute' as const,
    left: mousePosition?.x + 'px',
    top: 0,
    width: '1px',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 255, 0.5)',
    pointerEvents: 'none' as const,
  };

  const horizontalLine = {
    position: 'absolute' as const,
    top: mousePosition?.y + 'px',
    left: 0,
    width: '100%',
    height: '1px',
    backgroundColor: 'rgba(0, 0, 255, 0.5)',
    pointerEvents: 'none' as const,
  };

  // Render element based on type
  const renderElement = (element: ElementData) => {
    // Extract the key and other props separately
    const elementId = element.id;
    
    // Common props without the key
    const commonProps = {
      id: elementId,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      isSelected: selectedElementId === elementId,
      onSelect: () => setSelectedElementId(elementId),
      onDelete: () => deleteElement(elementId),
      onDragMove: (id: string, dx: number, dy: number) => {
        updateElement(id, {
          x: (elements.find(el => el.id === id)?.x || 0) + dx,
          y: (elements.find(el => el.id === id)?.y || 0) + dy,
        });
      },
      onDragEnd: () => {
        // Any cleanup or additional logic when drag ends
      },
      onResize: (id: string, newWidth: number, newHeight: number) => {
        updateElement(id, {
          width: newWidth,
          height: newHeight,
        });
      },
      onUpdate: (updates: Partial<ElementData>) => {
        // Cast to specific element type based on the element's type
        updateElement(elementId, updates);
      },
      onClick: () => setSelectedElementId(elementId),
      onContextMenu: (e: React.MouseEvent) => handleContextMenu(e, elementId),
      style: { 
        position: 'absolute' as const, 
        cursor: 'move',
        zIndex: element.zIndex || 1,
        // Add any additional styles here
      },
    };

    // Render the appropriate element based on type
    switch (element.type) {
      case 'button':
        return (
          <DraggableButton
            key={elementId}
            {...commonProps}
            text={element.text || 'Button'}
            variant={element.variant || 'contained'}
            color={element.color || 'primary'}
          />
        );
      case 'checkbox':
        return (
          <DraggableCheckbox
            key={elementId}
            {...commonProps}
            label={element.label || 'Checkbox'}
            checked={element.checked || false}
            zIndex={element.zIndex || 1}
            onUpdate={(updates) => updateElement(elementId, updates as Partial<Omit<CheckboxElement, 'id' | 'type'>>)}
            onResize={(id: string, newWidth: number, newHeight: number) => {
              // Update the element's dimensions in the state
              updateElement(id, { 
                width: newWidth,
                height: newHeight 
              } as Partial<Omit<CheckboxElement, 'id' | 'type'>>);
            }}
            onChange={(checked: boolean) => {
              updateElement(elementId, { 
                checked 
              } as Partial<Omit<CheckboxElement, 'id' | 'type'>>);
            }}
          />
        );
      case 'text':
        return (
          <DraggableText
            key={elementId}
            {...commonProps}
            content={element.content || 'Double click to edit'}
            fontSize={element.fontSize || 16}
            color={element.color || '#000000'}
            fontFamily={element.fontFamily || 'Arial, sans-serif'}
            textAlign={element.textAlign || 'left'}
            onUpdate={(updates) => updateElement(elementId, updates)}
            zIndex={element.zIndex || 1}
          />
        );
      default:
        console.warn('Unknown element type:', element.type);
        return null;
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Save Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveIcon />}
        onClick={handleSave}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1200,
          boxShadow: 3,
          '&:hover': {
            boxShadow: 6,
          },
        }}
      >
        Save
      </Button>

      <Box
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePosition(null)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(null);
          setMode('none');
          setSelectedElementId(null);
        }}
        sx={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#ffffff',
          minHeight: 'calc(100vh - 64px)',
          width: '100%',
          overflow: 'auto',
          boxSizing: 'border-box',
          border: 'none',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          cursor: mode === 'move' ? 'crosshair' : 'default',
        }}
      >
        {/* Grid Overlay */}
        {mode === 'move' && <Box sx={gridStyles} />}
        
        {/* Crosshair */}
        <Box sx={crosshairStyles}>
          <Box sx={verticalLine} />
          <Box sx={horizontalLine} />
        </Box>
        
        {elements.map(renderElement)}
        
        {/* Context Menu */}
        <Menu
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={() => handleContextMenuAction('move')}>Move</MenuItem>
          <MenuItem onClick={() => handleContextMenuAction('resize')}>Resize</MenuItem>
        </Menu>
        
        {/* Debug overlay - optional, can be removed in production */}
        {process.env.NODE_ENV === 'development' && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 1,
              fontSize: '0.8rem',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            Elements: {elements.length}
          </Box>
        )}
      </Box>

      {/* Snackbar for save status */}
      <Snackbar
        open={saveStatus.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={saveStatus.success ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {saveStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Canvas;
