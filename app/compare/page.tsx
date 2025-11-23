'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Card,
  CardContent,
  Stack,
  Divider,
  Alert,
  useColorScheme,
  Grid,
} from '@mui/material';
import { ArrowBack, DarkMode, LightMode, Clear } from '@mui/icons-material';
import { ProgressImage } from '@/types';
import { getAllImages, getImage, findImageByDateOffset } from '@/lib/storage';
import { sortByDate } from '@/lib/dateUtils';
import ComparisonView from '@/components/ComparisonView';
import QuickCompare from '@/components/QuickCompare';
import ImageCard from '@/components/ImageCard';

export default function ComparePage() {
  const router = useRouter();
  const { mode, setMode } = useColorScheme();
  const [images, setImages] = useState<ProgressImage[]>([]);
  const [selectedImage1, setSelectedImage1] = useState<ProgressImage | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<ProgressImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const allImages = await getAllImages();
      const sorted = sortByDate(allImages, 'newest');
      setImages(sorted);

      // Auto-select newest as first image
      if (sorted.length > 0) {
        setSelectedImage1(sorted[0]);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleColorMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const handleSelectImage = async (id: string) => {
    // Check if already selected - if so, deselect it
    if (selectedImage1?.id === id) {
      setSelectedImage1(selectedImage2);
      setSelectedImage2(null);
      return;
    }
    if (selectedImage2?.id === id) {
      setSelectedImage2(null);
      return;
    }

    // Not selected yet - add it
    const image = await getImage(id);
    if (!image) return;

    if (!selectedImage1) {
      setSelectedImage1(image);
    } else if (!selectedImage2) {
      setSelectedImage2(image);
    } else {
      // Both slots full - replace the second one
      setSelectedImage2(image);
    }
  };

  const handleQuickCompare = async (days: number) => {
    if (!selectedImage1) return;

    const comparison = await findImageByDateOffset(
      selectedImage1.date,
      days,
      selectedImage1.id
    );

    if (comparison) {
      setSelectedImage2(comparison);
    }
  };

  const clearSelection = () => {
    setSelectedImage1(null);
    setSelectedImage2(null);
  };

  const selectedIds = [
    selectedImage1?.id,
    selectedImage2?.id,
  ].filter(Boolean) as string[];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Compare Photos
          </Typography>
          {(selectedImage1 || selectedImage2) && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={clearSelection}
              sx={{ mr: 1 }}
            >
              Clear
            </Button>
          )}
          <IconButton onClick={toggleColorMode} title="Toggle theme">
            {mode === 'dark' ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          {/* Comparison View */}
          <Card>
            <CardContent>
              <ComparisonView image1={selectedImage1} image2={selectedImage2} />
            </CardContent>
          </Card>

          {/* Quick Compare */}
          {selectedImage1 && (
            <Card>
              <CardContent>
                <QuickCompare
                  onSelect={handleQuickCompare}
                  disabled={images.length < 2}
                />
                {images.length < 2 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Upload more photos to use quick compare
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <Divider />

          {/* Image Selection */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Photos to Compare
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Click on photos to select them for comparison
            </Typography>

            {loading ? (
              <Typography>Loading...</Typography>
            ) : images.length === 0 ? (
              <Alert severity="info">
                No photos available. Upload some photos first.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {images.map((image) => (
                  <Grid key={image.id} size={{ xs: 6, sm: 4, md: 3 }}>
                    <ImageCard
                      image={image}
                      onSelect={handleSelectImage}
                      selected={selectedIds.includes(image.id)}
                      selectable
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
