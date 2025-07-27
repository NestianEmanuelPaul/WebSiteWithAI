import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import DatabaseSchemaViewer from '../components/database/DatabaseSchemaViewer';

const DatabasePage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Database Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and manage your database schema. Click on a table to see its structure and relationships.
        </Typography>
      </Box>
      
      <DatabaseSchemaViewer />
    </Container>
  );
};

export default DatabasePage;
