import { useState, useEffect } from 'react';
import { API_BASE_URL } from './services/api';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Canvas from './components/canvas/Canvas';
import ElementsPalette from './components/palette/ElementsPalette';
import DatabasePage from './pages/DatabasePage';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import StorageIcon from '@mui/icons-material/Storage';
import HomeIcon from '@mui/icons-material/Home';
import { Drawer, Tooltip } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import type { ElementData, ElementType } from './types/element';
import { DatabaseFieldConnectionDialog } from './components/database/DatabaseFieldConnectionDialog';
import type { DatabaseSchema } from './services/api';

function App() {
  const [showElements, setShowElements] = useState(true);
  const [elements, setElements] = useState<ElementData[]>([]);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);

  // Save elements when they change
  const handleSave = async (newElements: ElementData[]) => {
    try {
      // Update local state
      setElements(newElements);
      
      // Format elements for the backend
      const formattedElements = newElements.map(element => {
        const { id, type, x, y, width, height, ...properties } = element;
        return {
          element_id: id,
          element_type: type,
          x,
          y,
          properties: {
            ...properties,
            width,
            height,
            // Ensure text or label is included for relevant elements
            text: (element as any).text || (element as any).label || 
                  (type === 'button' ? 'Button' : 
                   type === 'checkbox' ? 'Checkbox' : 
                   type === 'text' ? 'Text' : '')
          }
        };
      });

      console.log('Saving elements:', formattedElements);
      
      // Save to the backend
      const response = await fetch(`${API_BASE_URL}/elements/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedElements),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save failed with status:', response.status, 'Error:', errorData);
        throw new Error(`Failed to save elements: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Save successful:', result);
      return result;
    } catch (error) {
      console.error('Error saving elements:', error);
      throw error; // Re-throw to be caught by the Canvas component
    }
  };

  // Handle element drag start from palette
  const handleElementDragStart = (type: ElementType) => {
    console.log(`Dragging ${type} element`);
  };

  // Function to fetch the database schema
  const fetchDatabaseSchema = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/database/schema`);
      if (response.ok) {
        const data = await response.json();
        setSchema(data);
      }
    } catch (error) {
      console.error('Error fetching database schema:', error);
    }
  };

  // Call this when the app loads
  useEffect(() => {
    fetchDatabaseSchema();
  }, []);

  // Add this function to handle connecting an element to a database field
  const handleConnectToDatabase = (element: ElementData) => {
    setSelectedElement(element);
    setConnectionDialogOpen(true);
  };

  // Add this function to handle the generated code
  const handleApplyConnection = (code: string) => {
    if (!selectedElement) return;
    
    // Update the element with the new code
    const updatedElements = elements.map(el => 
      el.id === selectedElement.id 
        ? { ...el, data: { ...el.data, code } } 
        : el
    );
    
    setElements(updatedElements);
    setSelectedElement(null);
  };

  return (
    <Router>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <AppBar position="static" color="primary" elevation={2}>
          <Toolbar>
            <Tooltip title={showElements ? 'Hide Elements' : 'Show Elements'}>
              <IconButton
                color="inherit"
                onClick={() => setShowElements(!showElements)}
                aria-label={showElements ? 'Hide elements' : 'Show elements'}
                sx={{ mr: 2 }}
              >
                <ViewListIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1 }}>
              Drag & Drop Builder
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/" 
                startIcon={<HomeIcon />}
                sx={{ textTransform: 'none' }}
              >
                Canvas
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/database" 
                startIcon={<StorageIcon />}
                sx={{ textTransform: 'none' }}
              >
                Database
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Routes>
            {/* Canvas Route with Sidebar */}
            <Route path="/" element={
              <>
                {showElements && (
                  <Drawer
                    variant="persistent"
                    anchor="right"
                    open={showElements}
                    sx={{
                      '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                        borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
                        boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
                      <Typography variant="subtitle1" fontWeight="bold">Elements</Typography>
                    </Box>
                    <ElementsPalette onElementDragStart={handleElementDragStart} />
                  </Drawer>
                )}
                <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'auto', backgroundColor: '#fff' }}>
                  <Canvas 
                    initialElements={elements} 
                    onSave={handleSave} 
                    onElementDragStart={handleElementDragStart}
                    onConnectToDatabase={handleConnectToDatabase}
                  />
                  <DatabaseFieldConnectionDialog
                    open={connectionDialogOpen}
                    onClose={() => setConnectionDialogOpen(false)}
                    onConnect={handleApplyConnection}
                    elementType={selectedElement?.type || ''}
                    elementId={selectedElement?.id || ''}
                    schema={schema}
                    currentCode={selectedElement?.data?.code || ''}
                  />
                </Box>
              </>
            } />
            
            {/* Database Route */}
            <Route path="/database" element={
              <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'auto', backgroundColor: '#fff' }}>
                <DatabasePage />
              </Box>
            } />
          </Routes>
        </Box>
      </Box>
      <DatabaseFieldConnectionDialog
        open={connectionDialogOpen}
        onClose={() => setConnectionDialogOpen(false)}
        onConnect={handleApplyConnection}
        elementType={selectedElement?.type || ''}
        elementId={selectedElement?.id || ''}
        schema={schema}
        currentCode={selectedElement?.data?.code}
      />
      {selectedElement && (
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => handleConnectToDatabase(selectedElement)}
          sx={{ position: 'absolute', top: 16, right: 200, zIndex: 1000 }}
        >
          Connect to Database
        </Button>
      )}
    </Router>
  );
}

export default App;
