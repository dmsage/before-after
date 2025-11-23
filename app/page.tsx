'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Skeleton,
  useColorScheme,
  Grid,
} from '@mui/material';
import {
  Add,
  PhotoLibrary,
  Compare,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { getAllImages, exportData, importData } from '@/lib/storage';
import { sortByDate, formatDate } from '@/lib/dateUtils';
import { ProgressImage, SnackbarState } from '@/types';
import ImageCard from '@/components/ImageCard';

export default function Home() {
  const router = useRouter();
  const { mode, setMode } = useColorScheme();
  const [images, setImages] = useState<ProgressImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const allImages = await getAllImages();
      setImages(sortByDate(allImages, 'newest'));
    } catch (error) {
      console.error('Failed to load images:', error);
      showSnackbar('Failed to load images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weight-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Backup exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showSnackbar('Failed to export backup', 'error');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const count = await importData(data);
        await loadImages();
        showSnackbar(`Imported ${count} photos successfully`, 'success');
      } catch (error) {
        console.error('Import failed:', error);
        showSnackbar('Failed to import backup. Please check the file format.', 'error');
      }
    };
    input.click();
  };

  const toggleColorMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const recentImages = images.slice(0, 4);
  const oldestImage = images.length > 0 ? images[images.length - 1] : null;
  const newestImage = images.length > 0 ? images[0] : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => router.push('/')}
          >
            Weight Loss Tracker
          </Typography>
          <Button onClick={handleImport} size="small">
            Import
          </Button>
          <Button onClick={handleExport} size="small" disabled={images.length === 0}>
            Export
          </Button>
          <IconButton onClick={toggleColorMode} title="Toggle theme">
            {mode === 'dark' ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Quick Actions */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Add />}
                onClick={() => router.push('/upload')}
                sx={{ py: 2 }}
              >
                Upload Photo
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<Compare />}
                onClick={() => router.push('/compare')}
                disabled={images.length < 2}
                sx={{ py: 2 }}
              >
                Compare Photos
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<PhotoLibrary />}
                onClick={() => router.push('/gallery')}
                sx={{ py: 2 }}
              >
                View Gallery
              </Button>
            </Grid>
          </Grid>

          {/* Stats */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Progress
              </Typography>
              {loading ? (
                <Stack direction="row" spacing={4}>
                  <Skeleton width={100} height={40} />
                  <Skeleton width={150} height={40} />
                </Stack>
              ) : images.length === 0 ? (
                <Typography color="text.secondary">
                  Upload your first photo to start tracking your progress
                </Typography>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {images.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Photos
                    </Typography>
                  </Box>
                  {oldestImage && newestImage && oldestImage.id !== newestImage.id && (
                    <Box>
                      <Typography variant="body1">
                        <strong>First photo:</strong> {formatDate(oldestImage.date)}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Latest photo:</strong> {formatDate(newestImage.date)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Recent Photos */}
          {recentImages.length > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Photos</Typography>
                <Button size="small" onClick={() => router.push('/gallery')}>
                  View All
                </Button>
              </Stack>
              <Grid container spacing={2}>
                {recentImages.map((image) => (
                  <Grid key={image.id} size={{ xs: 6, sm: 3 }}>
                    <ImageCard image={image} compact />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Stack>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
