import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SmartButtonIcon from '@mui/icons-material/SmartButton';

type ElementType = 'text' | 'button' | 'checkbox';

interface DraggableItemProps {
  type: ElementType;
  label: string;
  icon: React.ReactNode;
  onDragStart: (e: React.DragEvent, type: ElementType) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ type, label, icon, onDragStart }) => (
  <ListItem disablePadding>
    <ListItemButton
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      sx={{
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        borderRadius: 1,
        mb: 0.5,
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        {icon}
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  </ListItem>
);

interface ElementsPaletteProps {
  onElementDragStart?: (type: ElementType) => void;
}

const ElementsPalette: React.FC<ElementsPaletteProps> = ({ onElementDragStart }) => {
  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    // Set data in multiple formats for better compatibility
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.setData('text/plain', type);
    
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'copy';
    
    // Add a custom class to the dragged item for visual feedback
    const target = e.target as HTMLElement;
    target.classList.add('dragging');
    
    // Set a custom drag image (optional)
    const dragImage = document.createElement('div');
    dragImage.textContent = `New ${type}`;
    dragImage.style.padding = '4px 8px';
    dragImage.style.background = '#1976d2';
    dragImage.style.color = 'white';
    dragImage.style.borderRadius = '4px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up the drag image after a short delay
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    if (onElementDragStart) {
      onElementDragStart(type);
    }
    
    console.log('Drag started with type:', type, 'Data types:', Array.from(e.dataTransfer.types));
  };

  return (
    <Box sx={{ p: 2, width: '100%' }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, pl: 1 }}>
        Elements
      </Typography>
      <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.paper' }}>
        <List dense>
          <DraggableItem
            type="text"
            label="Text"
            icon={<TextFieldsIcon />}
            onDragStart={handleDragStart}
          />
          <DraggableItem
            type="button"
            label="Button"
            icon={<SmartButtonIcon />}
            onDragStart={handleDragStart}
          />
          <DraggableItem
            type="checkbox"
            label="Checkbox"
            icon={<CheckBoxIcon />}
            onDragStart={handleDragStart}
          />
        </List>
      </Paper>
    </Box>
  );
};

export default ElementsPalette;
