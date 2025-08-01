import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Paper,
  Collapse,
  IconButton,
  styled,
} from '@mui/material';
import { Code as CodeIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { DatabaseSchema } from '../../services/api';
import { CodeTestingService } from '../../services/ai/codeTestingService';

// Styled components
const ExpandMore = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded: boolean }>(({ theme, expanded }) => ({
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

interface DatabaseFieldConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (code: string) => void;
  schema?: DatabaseSchema;
  elementType?: string;
  elementId?: string;
  currentCode?: string;
}

interface TestResult {
  attempt: number;
  success: boolean;
  error?: string;
}

export const DatabaseFieldConnectionDialog: React.FC<DatabaseFieldConnectionDialogProps> = ({
  open,
  onClose,
  onConnect,
  schema,
}) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [tables, setTables] = useState<{ name: string; fields: string[] }[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const testingService = useMemo(() => new CodeTestingService(5, apiUrl), [apiUrl]);

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
            fields: tableData.columns.map((col) => col.name),
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

  const handleTableChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedTable(event.target.value);
    setSelectedField('');
  }, []);

  const handleFieldChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedField(event.target.value);
  }, []);

  const handleGenerateAndTest = async () => {
    if (!selectedTable || !selectedField) {
      setError('Please select both a table and a field');
      return;
    }

    setLoading(true);
    setError('');
    setTestResults([]);
    setGeneratedCode('');

    try {
      // 1. Generate initial code
      const initialCode = generateCodeSnippet(selectedTable, selectedField);
      
      // 2. Create test function
      const testFn = async (code: string): Promise<{success: boolean; error?: string}> => {
        try {
          // Simple validation - in a real app, this would run actual tests
          if (!code.includes('useState')) {
            return { 
              success: false, 
              error: 'Code is missing required React hooks (useState)' 
            };
          }
          
          if (!code.includes('fetch') && !code.includes('axios')) {
            return { 
              success: false, 
              error: 'Code is missing data fetching logic' 
            };
          }
          
          return { success: true };
        } catch (err) {
          return { 
            success: false, 
            error: err instanceof Error ? err.message : 'Unknown error during testing' 
          };
        }
      };

      // 3. Run the test and fix loop
      const { code: finalCode, success } = await testingService.testAndFixCode(
        initialCode,
        testFn,
        (attempt, result) => {
          setTestResults(prev => [...prev, { attempt, ...result }]);
          setProgress({ current: attempt, total: 5 });
        }
      );

      // 4. Update state with results
      setGeneratedCode(finalCode);
      
      if (!success) {
        setError('Failed to fix all issues after maximum attempts');
      }
    } catch (err) {
      setError('An error occurred while generating code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCodeSnippet = (
    table: string, 
    field: string
  ): string => {
    return `// Generated code for ${table}.${field}
import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';

const DatabaseConnectedButton = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('${process.env.REACT_APP_API_URL}/api/${table}');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="contained" 
        onClick={handleClick}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Loading...' : 'Load Data'}
      </Button>
      
      {error && (
        <div style={{ color: 'red', marginTop: '8px' }}>
          Error: {error}
        </div>
      )}
      
      {data && (
        <div style={{ marginTop: '16px' }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectedButton;`;
  };

  const handleApply = () => {
    if (generatedCode) {
      onConnect(generatedCode);
      onClose();
    }
  };
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const selectedTableData = tables.find(t => t.name === selectedTable);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Connect to Database Field</DialogTitle>
      <DialogContent sx={{ minWidth: 500 }}>
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



          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleGenerateAndTest}
              disabled={!selectedTable || !selectedField || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CodeIcon />}
            >
              {loading ? 'Testing...' : 'Generate & Test Code'}
            </Button>
            
            {testResults.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                {progress.current}/{progress.total} attempts
              </Typography>
            )}
          </Box>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {testResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                }}
                onClick={handleExpandClick}
              >
                <Typography variant="subtitle2">
                  Test Results ({testResults.filter(r => r.success).length}/{testResults.length} passed)
                </Typography>
                <ExpandMore 
                  expanded={expanded}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                >
                  <ExpandMoreIcon />
                </ExpandMore>
              </Box>
              
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 1, maxHeight: '200px', overflow: 'auto' }}>
                  {testResults.map((result, index) => (
                    <Paper 
                      key={index} 
                      elevation={1} 
                      sx={{ 
                        p: 1.5, 
                        mb: 1,
                        bgcolor: result.success ? 'success.light' : 'error.light',
                        color: result.success ? 'success.contrastText' : 'error.contrastText'
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Attempt {index + 1}:</strong> {result.success ? 'Success' : result.error}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
          
          {generatedCode && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  Generated Code:
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  disabled={!generatedCode}
                >
                  Copy to Clipboard
                </Button>
              </Box>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {generatedCode}
              </Paper>
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
