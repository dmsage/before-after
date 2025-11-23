'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  useColorScheme,
} from '@mui/material';
import { ArrowBack, DarkMode, LightMode, Add } from '@mui/icons-material';
import ImageGallery from '@/components/ImageGallery';

export default function GalleryPage() {
  const router = useRouter();
  const { mode, setMode } = useColorScheme();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const toggleColorMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Photo Gallery
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => router.push('/upload')}
            sx={{ mr: 1 }}
          >
            Upload
          </Button>
          <IconButton onClick={toggleColorMode} title="Toggle theme">
            {mode === 'dark' ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ImageGallery
          refreshTrigger={refreshTrigger}
          onImagesChange={() => setRefreshTrigger((prev) => prev + 1)}
        />
      </Container>
    </Box>
  );
}
