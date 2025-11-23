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
  Skeleton,
  Grid,
} from '@mui/material';
import {
  Add,
  PhotoLibrary,
  Compare,
} from '@mui/icons-material';
import { getAllImages } from '@/lib/storage';
import { sortByDate, formatDate } from '@/lib/dateUtils';
import { ProgressImage } from '@/types';
import ImageCard from '@/components/ImageCard';

export default function Home() {
  const router = useRouter();
  const [images, setImages] = useState<ProgressImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const allImages = await getAllImages();
      setImages(sortByDate(allImages, 'newest'));
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentImages = images.slice(0, 4);
  const oldestImage = images.length > 0 ? images[images.length - 1] : null;
  const newestImage = images.length > 0 ? images[0] : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
    </Box>
  );
}
