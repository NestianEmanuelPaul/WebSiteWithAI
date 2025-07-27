import React, { useEffect, useState } from 'react';
import { fetchDatabaseSchema } from '../../services/api';
import type { DatabaseSchema, DatabaseTable } from '../../services/api';
import { Card, CardContent, CardHeader, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse, IconButton, Box } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

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

const DatabaseSchemaViewer: React.FC = () => {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        setLoading(true);
        const data = await fetchDatabaseSchema();
        setSchema(data);
      } catch (err) {
        console.error('Failed to load database schema:', err);
        setError('Failed to load database schema. Please check the console for more details.');
      } finally {
        setLoading(false);
      }
    };

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

  if (!schema || Object.keys(schema).length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography>No database schema found.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Database Schema" 
        subheader={`${Object.keys(schema).length} tables found`}
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
                <TableRowComponent 
                  key={tableName} 
                  tableName={tableName} 
                  tableData={tableData} 
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default DatabaseSchemaViewer;
