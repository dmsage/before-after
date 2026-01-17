'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { ProgressImage } from '@/types';
import { getAllImages, getImage, findImageByDateOffset } from '@/lib/storage';
import { sortByDate } from '@/lib/dateUtils';
import ComparisonView from '@/components/ComparisonView';
import QuickCompare from '@/components/QuickCompare';
import ImageCard from '@/components/ImageCard';

const STORAGE_KEY = 'compare-selected-ids';

export default function ComparePage() {
  const [images, setImages] = useState<ProgressImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<(ProgressImage | null)[]>([null, null, null, null]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const selectedIds = selectedImages
    .filter((img): img is ProgressImage => img !== null)
    .map(img => img.id);

  useEffect(() => {
    loadImages();
  }, []);

  // Persist selected image IDs to sessionStorage (only after initial load)
  useEffect(() => {
    if (!initialized) return;

    if (selectedIds.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedIds, initialized]);

  const loadImages = async () => {
    try {
      const allImages = await getAllImages();
      const sorted = sortByDate(allImages, 'newest');
      setImages(sorted);

      // Try to restore selection from sessionStorage
      const savedIds = sessionStorage.getItem(STORAGE_KEY);
      if (savedIds) {
        const ids: string[] = JSON.parse(savedIds);
        const restored: (ProgressImage | null)[] = ids.map(id =>
          sorted.find(img => img.id === id) || null
        );
        while (restored.length < 4) restored.push(null);
        if (restored.some(img => img !== null)) {
          setSelectedImages(restored);
          return;
        }
      }

      // Fallback: auto-select newest as first image
      if (sorted.length > 0) {
        setSelectedImages([sorted[0], null, null, null]);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const handleSelectImage = async (id: string) => {
    // Check if already selected - if so, deselect it
    const existingIndex = selectedImages.findIndex(img => img?.id === id);
    if (existingIndex !== -1) {
      const newSelected = [...selectedImages];
      newSelected[existingIndex] = null;
      // Compact the array - move nulls to the end
      const compacted: (ProgressImage | null)[] = newSelected.filter(img => img !== null);
      while (compacted.length < 4) compacted.push(null);
      setSelectedImages(compacted);
      return;
    }

    // Not selected yet - add it to first empty slot
    const image = await getImage(id);
    if (!image) return;

    const firstEmptyIndex = selectedImages.findIndex(img => img === null);
    if (firstEmptyIndex !== -1) {
      const newSelected = [...selectedImages];
      newSelected[firstEmptyIndex] = image;
      setSelectedImages(newSelected);
    } else {
      // All slots full - replace the last one
      const newSelected = [...selectedImages];
      newSelected[3] = image;
      setSelectedImages(newSelected);
    }
  };

  const handleQuickCompare = async (days: number) => {
    const firstImage = selectedImages[0];
    if (!firstImage) return;

    const comparison = await findImageByDateOffset(
      firstImage.date,
      days,
      firstImage.id
    );

    if (comparison) {
      const newSelected = [...selectedImages];
      newSelected[1] = comparison;
      setSelectedImages(newSelected);
    }
  };

  const clearSelection = () => {
    setSelectedImages([null, null, null, null]);
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              Compare Photos
            </Typography>
            {hasSelection && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Clear />}
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
            )}
          </Stack>
          {/* Comparison View */}
          <Card>
            <CardContent>
              <ComparisonView images={selectedImages} />
            </CardContent>
          </Card>

          {/* Quick Compare */}
          {selectedImages[0] && (
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
