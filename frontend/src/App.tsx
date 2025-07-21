import { useState } from 'react';
import Canvas from './components/canvas/Canvas';
import ElementsPalette from './components/palette/ElementsPalette';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Drawer } from '@mui/material';
import type { ElementData } from './types/element';

function App() {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [elements, setElements] = useState<ElementData[]>([]);

  // Save elements to localStorage when they change
  const handleSave = (newElements: ElementData[]) => {
    setElements(newElements);
    // You can also save to localStorage or an API here
    // localStorage.setItem('canvas-elements', JSON.stringify(newElements));
  };

  // Handle element drag start from palette
  const handleElementDragStart = (type: string) => {
    // This can be used to show visual feedback if needed
    console.log(`Dragging ${type} element`);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1 }}>
            Drag & Drop Builder
          </Typography>
          <IconButton
            color="inherit"
            edge="end"
            onClick={() => setPaletteOpen(!paletteOpen)}
            sx={{ ml: 2 }}
            aria-label={paletteOpen ? 'Hide palette' : 'Show palette'}
          >
            {paletteOpen ? <ChevronRightIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative',
        height: 'calc(100vh - 64px)', // Subtract AppBar height
        width: '100%',
        backgroundColor: '#f0f0f0' // Light gray background for the main content area
      }}>
        {/* Elements Palette */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={paletteOpen}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              borderRight: '1px solid #e0e0e0',
              backgroundColor: '#f5f5f5',
              height: '100%',
              position: 'relative',
              marginTop: 0,
            },
          }}
        >
          <ElementsPalette onElementDragStart={handleElementDragStart} />
        </Drawer>

        {/* Canvas Area */}
        <Box 
          component="main"
          sx={{
            flex: 1,
            height: '100%',
            overflow: 'auto',
            position: 'relative',
            transition: 'margin 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
            marginLeft: paletteOpen ? '240px' : 0,
            width: paletteOpen ? 'calc(100% - 240px)' : '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff', // White background for the canvas area
          }}
        >
          <Canvas 
            initialElements={elements}
            onSave={handleSave}
            onElementDragStart={handleElementDragStart}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default App;
