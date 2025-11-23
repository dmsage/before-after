'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import ImageGallery from '@/components/ImageGallery';

export default function GalleryPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Photo Gallery
        </Typography>
        <ImageGallery
          refreshTrigger={refreshTrigger}
          onImagesChange={() => setRefreshTrigger((prev) => prev + 1)}
        />
      </Container>
    </Box>
  );
}
