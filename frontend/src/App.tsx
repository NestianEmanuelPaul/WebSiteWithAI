import { useState } from 'react';
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

function App() {
  const [showElements, setShowElements] = useState(true);
  const [elements, setElements] = useState<ElementData[]>([]);

  // Save elements when they change
  const handleSave = (newElements: ElementData[]) => {
    setElements(newElements);
  };

  // Handle element drag start from palette
  const handleElementDragStart = (type: ElementType) => {
    console.log(`Dragging ${type} element`);
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
    </Router>
  );
}

export default App;
