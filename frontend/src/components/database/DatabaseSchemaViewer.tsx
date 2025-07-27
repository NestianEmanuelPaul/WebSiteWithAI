import React, { useEffect, useState } from 'react';
import { fetchDatabaseSchema } from '../../services/api';
import type { DatabaseSchema, DatabaseTable } from '../../services/api';
import { 
  Card, CardContent, CardHeader, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Collapse, IconButton, Box, 
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  MenuItem, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Add as AddIcon, Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';

interface TableRowProps {
  tableName: string;
  tableData: DatabaseTable;
}

const TableRowComponent: React.FC<TableRowProps> = ({ tableName, tableData }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography variant="subtitle1" fontWeight="bold">{tableName}</Typography>
        </TableCell>
        <TableCell>{tableData.columns.length} columns</TableCell>
        <TableCell>{tableData.foreign_keys.length} relationships</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Columns
              </Typography>
              <Table size="small" aria-label="columns">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Nullable</TableCell>
                    <TableCell>Primary Key</TableCell>
                    <TableCell>Default</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.columns.map((column) => (
                    <TableRow key={column.name}>
                      <TableCell component="th" scope="row">
                        {column.name}
                      </TableCell>
                      <TableCell>{column.type}</TableCell>
                      <TableCell>{column.nullable ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{column.primary_key ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{column.default || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {tableData.foreign_keys.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
                    Relationships
                  </Typography>
                  <Table size="small" aria-label="relationships">
                    <TableHead>
                      <TableRow>
                        <TableCell>From Column</TableCell>
                        <TableCell>To Table</TableCell>
                        <TableCell>To Column</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableData.foreign_keys.map((fk, index) => (
                        <TableRow key={index}>
                          <TableCell>{fk.constrained_columns.join(', ')}</TableCell>
                          <TableCell>{fk.referred_table}</TableCell>
                          <TableCell>{fk.referred_columns.join(', ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

// Define types for the new table form
interface ForeignKeyReference {
  table: string;
  column: string;
}

interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue: string;
  isForeignKey: boolean;
  foreignKey?: ForeignKeyReference;
}

const columnTypes = [
  'INTEGER',
  'TEXT',
  'VARCHAR(255)',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'FLOAT',
  'JSON',
  'BLOB'
];

const DatabaseSchemaViewer: React.FC = () => {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { 
      name: 'id', 
      type: 'INTEGER', 
      nullable: false, 
      primaryKey: true, 
      defaultValue: '',
      isForeignKey: false
    },
    { 
      name: 'created_at', 
      type: 'DATETIME', 
      nullable: false, 
      primaryKey: false, 
      defaultValue: 'CURRENT_TIMESTAMP',
      isForeignKey: false
    },
    { 
      name: 'updated_at', 
      type: 'DATETIME', 
      nullable: false, 
      primaryKey: false, 
      defaultValue: 'CURRENT_TIMESTAMP',
      isForeignKey: false
    }
  ]);
  
  // Get available tables for foreign key references
  const availableTables = schema ? Object.keys(schema) : [];
  const [tableColumns, setTableColumns] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  // Define all handler functions before they're used in JSX
  const handleAddColumn = () => {
    setColumns([...columns, { 
      name: '', 
      type: 'TEXT', 
      nullable: true, 
      primaryKey: false, 
      defaultValue: '',
      isForeignKey: false
    }]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) return; // Don't remove the last column
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const handleColumnChange = (index: number, field: keyof ColumnDefinition, value: any) => {
    const newColumns = [...columns];
    (newColumns[index] as any)[field] = value;
    
    // If primary key is checked, ensure it's not nullable
    if (field === 'primaryKey' && value === true) {
      newColumns[index].nullable = false;
    }
    
    setColumns(newColumns);
  };

  const handleSubmit = async () => {
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }
    
    // Allow all columns to be modified, including system columns
    // Note: Be cautious when modifying system columns as it might break the application
    if (isEditing) {
      // No validation for protected columns
    }

    // Validate column names and types
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (!col.name.trim()) {
        setError(`Column ${i + 1} name is required`);
        return;
      }
      if (!col.type) {
        setError(`Column ${i + 1} type is required`);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare the request body with foreign key information
      const requestBody = {
        name: tableName,
        columns: columns.map(col => {
          // Skip the id, created_at, and updated_at columns when creating a new table
          if (!isEditing && ['id', 'created_at', 'updated_at'].includes(col.name)) {
            return null;
          }
          
          const columnData: any = {
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            default: col.defaultValue || undefined,
            primary_key: col.primaryKey
          };
          
          // Add foreign key information if this is a foreign key
          if (col.isForeignKey && col.foreignKey) {
            columnData.foreign_key = {
              table: col.foreignKey.table,
              column: col.foreignKey.column
            };
            
            // Ensure the column type matches the referenced column's type
            if (col.foreignKey.column === 'id') {
              columnData.type = 'INTEGER';
            }
          }
          
          return columnData;
        }).filter(Boolean) // Remove any null entries (skipped columns)
      };
      
      const url = isEditing && editingTable 
        ? `http://localhost:8000/api/db/tables/${editingTable}`
        : 'http://localhost:8000/api/db/tables/';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create table');
      }

      // Refresh the schema
      await loadSchema();
      setOpenDialog(false);
      
      // Reset form
      setTableName('');
      setColumns([
        { 
          name: 'id', 
          type: 'INTEGER', 
          nullable: false, 
          primaryKey: true, 
          defaultValue: '',
          isForeignKey: false
        },
        { 
          name: 'created_at', 
          type: 'DATETIME', 
          nullable: false, 
          primaryKey: false, 
          defaultValue: 'CURRENT_TIMESTAMP',
          isForeignKey: false
        },
        { 
          name: 'updated_at', 
          type: 'DATETIME', 
          nullable: false, 
          primaryKey: false, 
          defaultValue: 'CURRENT_TIMESTAMP',
          isForeignKey: false
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      setSaving(false);
    }
  };

  const loadSchema = async () => {
    try {
      const data = await fetchDatabaseSchema();
      setSchema(data);
      
      // Preload table columns for foreign key references
      const columnsByTable: Record<string, string[]> = {};
      Object.entries(data).forEach(([tableName, tableData]) => {
        columnsByTable[tableName] = tableData.columns.map(col => col.name);
      });
      setTableColumns(columnsByTable);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database schema');
      setSchema(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTable = () => {
    setTableName('');
    setColumns([
      { 
        name: 'id', 
        type: 'INTEGER', 
        nullable: false, 
        primaryKey: true, 
        defaultValue: '',
        isForeignKey: false
      },
      { 
        name: 'created_at', 
        type: 'DATETIME', 
        nullable: false, 
        primaryKey: false, 
        defaultValue: 'CURRENT_TIMESTAMP',
        isForeignKey: false
      },
      { 
        name: 'updated_at', 
        type: 'DATETIME', 
        nullable: false, 
        primaryKey: false, 
        defaultValue: 'CURRENT_TIMESTAMP',
        isForeignKey: false
      }
    ]);
    setOpenDialog(true);
    setIsEditing(false);
    setEditingTable(null);
  };

  const handleEditTable = (tableName: string, tableData: DatabaseTable) => {
    const columnDefs: ColumnDefinition[] = tableData.columns.map(col => {
      // Find if this column has a foreign key
      const fk = tableData.foreign_keys.find(fk => 
        fk.constrained_columns && fk.constrained_columns[0] === col.name
      );

      return {
        name: col.name,
        type: col.type.toUpperCase(),
        nullable: col.nullable,
        primaryKey: col.primary_key || false,
        defaultValue: col.default || '',
        isForeignKey: !!fk,
        foreignKey: fk ? {
          table: fk.referred_table || '',
          column: fk.referred_columns ? fk.referred_columns[0] : 'id'
        } : undefined
      };
    });

    setTableName(tableName);
    setColumns(columnDefs);
    setOpenDialog(true);
    setIsEditing(true);
    setEditingTable(tableName);
  };

  useEffect(() => {
    loadSchema();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading database schema...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  // Handle foreign key toggle
  const handleForeignKeyToggle = (index: number, checked: boolean) => {
    const newColumns = [...columns];
    newColumns[index].isForeignKey = checked;
    
    if (checked) {
      // Set default foreign key reference if not set
      if (!newColumns[index].foreignKey && availableTables.length > 0) {
        const firstTable = availableTables[0];
        const firstColumn = tableColumns[firstTable]?.[0] || 'id';
        newColumns[index].foreignKey = {
          table: firstTable,
          column: firstColumn
        };
      }
    }
    
    setColumns(newColumns);
  };

  // Handle foreign key table change
  const handleForeignKeyTableChange = (index: number, tableName: string) => {
    const newColumns = [...columns];
    if (!newColumns[index].foreignKey) {
      newColumns[index].foreignKey = { table: tableName, column: 'id' };
    } else {
      newColumns[index].foreignKey = {
        ...newColumns[index].foreignKey!,
        table: tableName,
        column: tableColumns[tableName]?.[0] || 'id' // Reset to first column when table changes
      };
    }
    setColumns(newColumns);
  };

  // Handle foreign key column change
  const handleForeignKeyColumnChange = (index: number, columnName: string) => {
    const newColumns = [...columns];
    if (newColumns[index].foreignKey) {
      newColumns[index].foreignKey = {
        ...newColumns[index].foreignKey!,
        column: columnName
      };
    }
    setColumns(newColumns);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    if (!saving) {
      setOpenDialog(false);
      setError(null);
    }
  };

  // Render the dialog outside the error condition
  const renderDialog = () => (
    <Dialog 
      open={openDialog} 
      onClose={handleDialogClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="table-dialog-title"
    >
          <DialogTitle id="table-dialog-title">
            {isEditing ? 'Edit Table' : 'Create New Table'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, mb: 3 }}>
              <TextField
                label="Table Name"
                fullWidth
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                disabled={saving}
                required
                helperText="Enter a name for the new table"
              />
            </Box>
            
            <Typography variant="h6" gutterBottom>Columns</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
              <Box sx={{ width: '25%' }}><strong>Name</strong></Box>
              <Box sx={{ width: '20%' }}><strong>Type</strong></Box>
              <Box sx={{ width: '15%' }}><strong>Nullable</strong></Box>
              <Box sx={{ width: '15%' }}><strong>Primary Key</strong></Box>
              <Box sx={{ width: '20%' }}><strong>Default Value</strong></Box>
              <Box sx={{ width: '5%' }}></Box>
            </Box>
            
            {columns.map((col, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Box sx={{ width: '25%' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={col.name}
                    onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                    disabled={saving}
                    required
                  />
                </Box>
                <Box sx={{ width: '20%' }}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    value={col.type}
                    onChange={(e) => handleColumnChange(index, 'type', e.target.value)}
                    disabled={saving}
                    required
                  >
                    {columnTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box sx={{ width: '15%' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={col.nullable}
                        onChange={(e) => handleColumnChange(index, 'nullable', e.target.checked)}
                        disabled={saving || col.primaryKey}
                      />
                    }
                    label="Nullable"
                  />
                </Box>
                <Box sx={{ width: '15%' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={col.primaryKey}
                        onChange={(e) => handleColumnChange(index, 'primaryKey', e.target.checked)}
                        disabled={saving || col.isForeignKey}
                      />
                    }
                    label="Primary Key"
                  />
                </Box>
                <Box sx={{ width: '15%' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={col.isForeignKey}
                        onChange={(e) => handleForeignKeyToggle(index, e.target.checked)}
                        disabled={saving || availableTables.length === 0}
                      />
                    }
                    label="Foreign Key"
                  />
                </Box>
                <Box sx={{ width: '20%' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={col.defaultValue}
                    onChange={(e) => handleColumnChange(index, 'defaultValue', e.target.value)}
                    disabled={saving || col.primaryKey || col.isForeignKey}
                    placeholder={col.isForeignKey ? 'Auto-set' : 'Optional'}
                  />
                </Box>
                {col.isForeignKey && availableTables.length > 0 && (
                  <>
                    <Box sx={{ width: '15%' }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="References Table"
                        value={col.foreignKey?.table || ''}
                        onChange={(e) => handleForeignKeyTableChange(index, e.target.value)}
                        disabled={saving}
                      >
                        {availableTables.map((table) => (
                          <MenuItem key={table} value={table}>
                            {table}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                    <Box sx={{ width: '15%' }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="References Column"
                        value={col.foreignKey?.column || ''}
                        onChange={(e) => handleForeignKeyColumnChange(index, e.target.value)}
                        disabled={saving || !col.foreignKey?.table}
                      >
                        {col.foreignKey?.table && tableColumns[col.foreignKey.table]?.map((colName) => (
                          <MenuItem key={colName} value={colName}>
                            {colName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </>
                )}
                <Box sx={{ width: '5%', display: 'flex', justifyContent: 'center' }}>
                  {columns.length > 1 && !['id', 'created_at', 'updated_at'].includes(col.name) && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveColumn(index)}
                      disabled={saving}
                      color="error"
                      aria-label="remove column"
                    >
                      ×
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddColumn}
                disabled={saving}
                sx={{ mr: 1 }}
              >
                Add Column
              </Button>
              {isEditing && (
                <Button 
                  variant="outlined"
                  color="warning"
                  onClick={() => handleEditTable(tableName, schema?.[tableName] as DatabaseTable)}
                  disabled={saving}
                >
                  Reset Changes
                </Button>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)} 
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              color="primary" 
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving || !tableName.trim()}
            >
              {saving 
                ? isEditing 
                  ? 'Saving...' 
                  : 'Creating...' 
                : isEditing 
                  ? 'Save Changes' 
                  : 'Create Table'}
            </Button>
          </DialogActions>
        </Dialog>
  );

  if (!schema || Object.keys(schema).length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography>No database schema found.</Typography>
        </CardContent>
      </Card>
    );
  }

  // Render the main component
  return (
    <Card>
      <CardHeader 
        title="Database Schema" 
        subheader="View and manage your database structure"
        action={
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNewTable}
              sx={{ mr: 1 }}
            >
              New Table
            </Button>
            <Button
              variant="outlined"
              onClick={loadSchema}
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </>
        }
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table aria-label="database schema">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Table Name</TableCell>
                <TableCell>Columns</TableCell>
                <TableCell>Relationships</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(schema).map(([tableName, tableData]) => (
                <TableRow 
                  key={tableName}
                  sx={{ '& > *': { borderBottom: 'unset' } }}
                  hover
                >
                  <TableCell>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => setExpandedTable(expandedTable === tableName ? null : tableName)}
                    >
                      {expandedTable === tableName ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>
                        {tableName}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTable(tableName, tableData);
                        }}
                        title="Edit table"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{tableData.columns.length} columns</TableCell>
                  <TableCell>{tableData.foreign_keys?.length || 0} relationships</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      {renderDialog()}
    </Card>
  );
};

export default DatabaseSchemaViewer;
