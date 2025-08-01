import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Button, Menu, MenuItem, Snackbar, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import type { ElementData, ElementType } from '../../types/element';
import DraggableButton from './elements/DraggableButton';
import { DatabaseFieldConnectionDialog } from '../database/DatabaseFieldConnectionDialog';
import { loadElements } from '../../services/api';

const GRID_SIZE = 2; // Smaller grid size for precise snapping

interface CanvasProps {
  initialElements?: ElementData[];
  onSave?: (elements: ElementData[]) => void;
  onElementDragStart?: (type: ElementType) => void;
  onConnectToDatabase?: (element: ElementData) => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  initialElements = [], 
  onSave,
  onElementDragStart,
  onConnectToDatabase 
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

  // Update a specific element by ID
  const updateElement = useCallback((id: string, updates: Partial<Omit<ElementData, 'id' | 'type'>>) => {
    setElements(prevElements => 
      prevElements.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
    );
  }, []);

  // Handle elements change
  const handleElementsChange = useCallback(async (newElements: ElementData[]) => {
    setElements(newElements);
    if (onSave) {
      try {
        await onSave(newElements);
        setSaveStatus({
          open: true,
          success: true,
          message: 'Elements saved successfully!'
        });
      } catch (error) {
        console.error('Error saving elements:', error);
        setSaveStatus({
          open: true,
          success: false,
          message: 'Failed to save elements. Please try again.'
        });
      }
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

    // Delete an element
  const deleteElement = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    handleElementsChange(newElements);
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [elements, handleElementsChange, selectedElementId]);

  const handleCloseSnackbar = () => {
    setSaveStatus({ open: false, success: false, message: '' });
  };

  // State for database connection dialog
  const [dbConnectionDialogOpen, setDbConnectionDialogOpen] = useState(false);
  const [selectedElementForDb, setSelectedElementForDb] = useState<ElementData | null>(null);

  // Handle context menu
  const handleContextMenu = useCallback((event: React.MouseEvent, elementId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    setSelectedElementId(elementId);
    setSelectedElementForDb(element);
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      elementId
    });
  }, [elements]);
  
  // Handle connect to database menu item click
  const handleConnectToDbClick = useCallback(() => {
    setContextMenu(null);
    setDbConnectionDialogOpen(true);
  }, []);
  
  // Handle database connection dialog close
  const handleDbDialogClose = useCallback(() => {
    setDbConnectionDialogOpen(false);
    setSelectedElementForDb(null);
  }, []);
  
  // Handle successful database connection
  const handleDbConnect = useCallback((code: string) => {
    if (onConnectToDatabase && selectedElementForDb) {
      // Create a new element with the database connection code
      const updatedElement = {
        ...selectedElementForDb,
        data: {
          ...selectedElementForDb.data,
          databaseCode: code
        }
      };
      onConnectToDatabase(updatedElement);
    }
    setDbConnectionDialogOpen(false);
    setSelectedElementForDb(null);
  }, [onConnectToDatabase, selectedElementForDb]);

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

  // Render a single element based on its type
  const renderElement = (element: ElementData) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedElementId(element.id);
    };

    switch (element.type) {
      case 'button':
        return (
          <DraggableButton
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            zIndex={element.zIndex || 1}
            text={element.text || 'Button'}
            variant={element.variant || 'contained'}
            color={element.color || 'primary'}
            width={element.width || 120}
            height={element.height || 40}
            isSelected={selectedElementId === element.id}
            onContextMenu={(event: React.MouseEvent) => handleContextMenu(event, element.id)}
            onClick={handleClick}
            onDelete={() => deleteElement(element.id)}
            onDragMove={(id, dx, dy) => {
              updateElement(id, {
                x: element.x + dx,
                y: element.y + dy
              });
            }}
            onDragEnd={() => {
              if (onSave) onSave(elements);
            }}
            onResize={(id, newWidth, newHeight) => {
              updateElement(id, { width: newWidth, height: newHeight });
            }}
            onSelect={() => setSelectedElementId(element.id)}
          />
        );
      default:
        console.warn(`Unsupported element type: ${element.type}`);
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
        onClick={async () => {
          try {
            await handleElementsChange(elements);
          } catch (error) {
            console.error('Error saving elements:', error);
          }
        }}
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
        {/* Elements */}
        {elements.map((element) => renderElement(element))}

        {/* Context menu */}
        <Menu
          open={contextMenu !== null}
          onClose={() => setContextMenu(null)}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null && contextMenu.elementId
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleConnectToDbClick}>Connect to Database</MenuItem>
        </Menu>
        
        {/* Database Connection Dialog */}
        {selectedElementForDb && (
          <DatabaseFieldConnectionDialog
            open={dbConnectionDialogOpen}
            onClose={handleDbDialogClose}
            onConnect={handleDbConnect}
            elementType={selectedElementForDb.type}
            elementId={selectedElementForDb.id}
            schema={undefined} // Pass your database schema here if available
            currentCode={selectedElementForDb.data?.databaseCode || ''}
          />
        )}

        {/* Snackbar for save status */}
        <Snackbar
          open={saveStatus.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
    </Box>
  );
};

// Export the component as default
export default Canvas;
