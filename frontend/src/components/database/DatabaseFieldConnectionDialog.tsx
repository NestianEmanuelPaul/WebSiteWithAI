import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import type { DatabaseSchema } from '../../services/api';
import { generateAICode } from '../../services/api';

interface DatabaseFieldConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (code: string) => void;
  elementType: string;
  elementId: string;
  schema: DatabaseSchema | null;
  currentCode?: string;
}

export const DatabaseFieldConnectionDialog: React.FC<DatabaseFieldConnectionDialogProps> = ({
  open,
  onClose,
  onConnect,
  elementType,
  elementId,
  schema,
  currentCode = '',
}) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [action, setAction] = useState<'read' | 'write' | 'both'>('both');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [tables, setTables] = useState<{name: string; fields: string[]}[]>([]);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        let schemaToUse = schema;
        
        // If schema is not provided, fetch it from the API
        if (!schemaToUse) {
          try {
            const response = await fetch('http://localhost:8000/api/db/schema');
            if (!response.ok) {
              throw new Error(`Failed to fetch schema: ${response.status}`);
            }
            schemaToUse = await response.json();
            console.log('Fetched schema:', schemaToUse); // Debug log
          } catch (fetchError) {
            console.error('Error fetching database schema:', fetchError);
            setError('Failed to load database schema. Please ensure the backend server is running.');
            return;
          }
        }
        
        if (schemaToUse) {
          const tableList = Object.entries(schemaToUse).map(([tableName, tableData]) => ({
            name: tableName,
            fields: tableData.columns.map(col => col.name)
          }));
          setTables(tableList);
        }
      } catch (error) {
        console.error('Error loading database schema:', error);
        setError('Failed to load database schema');
      }
    };
    
    if (open) {
      loadSchema();
    }
  }, [schema, open]);

  const handleTableChange = (event: SelectChangeEvent) => {
    const tableName = event.target.value;
    setSelectedTable(tableName);
    setSelectedField('');
  };

  const handleFieldChange = (event: SelectChangeEvent) => {
    setSelectedField(event.target.value);
  };

  const handleActionChange = (event: SelectChangeEvent) => {
    setAction(event.target.value as 'read' | 'write' | 'both');
  };

  const handleGenerateCode = async () => {
    if (!selectedTable || !selectedField) {
      setError('Please select both a table and a field');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await generateAICode({
        element_type: elementType,
        element_id: elementId,
        table_name: selectedTable,
        field_name: selectedField,
        action,
        current_code: currentCode,
      });

      if (response.success) {
        setGeneratedCode(response.generated_code);
      } else {
        setError(response.message || 'Failed to generate code');
      }
    } catch (err) {
      setError('An error occurred while generating code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedCode) {
      onConnect(generatedCode);
      onClose();
    }
  };

  const selectedTableData = tables.find(t => t.name === selectedTable);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Connect to Database Field</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="table-select-label">Table</InputLabel>
            <Select
              labelId="table-select-label"
              value={selectedTable}
              label="Table"
              onChange={handleTableChange}
              disabled={loading}
            >
              {tables.map((table) => (
                <MenuItem key={table.name} value={table.name}>
                  {table.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedTable || loading}>
            <InputLabel id="field-select-label">Field</InputLabel>
            <Select
              labelId="field-select-label"
              value={selectedField}
              label="Field"
              onChange={handleFieldChange}
              disabled={!selectedTable || loading}
            >
              {selectedTableData?.fields.map((field) => (
                <MenuItem key={field} value={field}>
                  {field}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="action-select-label">Action</InputLabel>
            <Select
              labelId="action-select-label"
              value={action}
              label="Action"
              onChange={handleActionChange}
              disabled={loading}
            >
              <MenuItem value="read">Read Only</MenuItem>
              <MenuItem value="write">Write Only</MenuItem>
              <MenuItem value="both">Read & Write</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleGenerateCode}
            disabled={!selectedTable || !selectedField || loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Code'}
          </Button>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {generatedCode && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Generated Code:
              </Typography>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '4px',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}>
                {generatedCode}
              </pre>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!generatedCode || loading}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};
