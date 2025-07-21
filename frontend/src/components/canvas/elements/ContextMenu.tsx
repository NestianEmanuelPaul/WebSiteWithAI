import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';

interface ContextMenuProps {
  contextMenu: { mouseX: number; mouseY: number } | null;
  onClose: () => void;
  onDelete: () => void;
  onMove: () => void;
  onResize: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  onClose,
  onDelete,
  onMove,
  onResize,
}) => {
  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
    >
      <MenuItem onClick={onMove}>
        <ListItemIcon>
          <OpenWithIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Move</ListItemText>
      </MenuItem>
      <MenuItem onClick={onResize}>
        <ListItemIcon>
          <AspectRatioIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Resize</ListItemText>
      </MenuItem>
      <MenuItem onClick={onDelete}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;
