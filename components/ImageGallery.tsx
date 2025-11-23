'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { ProgressImage, SortOrder } from '@/types';
import { getAllImages, deleteImage, saveImage } from '@/lib/storage';
import { sortByDate } from '@/lib/dateUtils';
import { compressCroppedImage, CropArea } from '@/lib/cropUtils';
import ImageCard from './ImageCard';
import ImageCropper from './ImageCropper';

interface ImageGalleryProps {
  onSelectForCompare?: (id: string) => void;
  selectedIds?: string[];
  selectable?: boolean;
  refreshTrigger?: number;
  onImagesChange?: () => void;
}

export default function ImageGallery({
  onSelectForCompare,
  selectedIds = [],
  selectable = false,
  refreshTrigger = 0,
  onImagesChange,
}: ImageGalleryProps) {
  const [images, setImages] = useState<ProgressImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [reCropImage, setReCropImage] = useState<ProgressImage | null>(null);

  useEffect(() => {
    loadImages();
  }, [refreshTrigger]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const allImages = await getAllImages();
      setImages(sortByDate(allImages, sortOrder));
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setImages((prev) => sortByDate(prev, sortOrder));
  }, [sortOrder]);

  const handleDeleteClick = (id: string) => {
    setImageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      await deleteImage(imageToDelete);
      setImages((prev) => prev.filter((img) => img.id !== imageToDelete));
      onImagesChange?.();
    } catch (error) {
      console.error('Failed to delete image:', error);
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setImageToDelete(null);
  };

  const handleReCrop = (image: ProgressImage) => {
    setReCropImage(image);
  };

  const handleReCropComplete = async (croppedBlob: Blob, cropArea: CropArea) => {
    if (!reCropImage) return;

    try {
      const { data, size } = await compressCroppedImage(croppedBlob);

      const updatedImage: ProgressImage = {
        ...reCropImage,
        imageData: data,
        fileSize: size,
        cropSettings: {
          x: cropArea.x,
          y: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
          zoom: 1,
          aspectRatio: null,
        },
      };

      await saveImage(updatedImage);
      setImages((prev) =>
        prev.map((img) => (img.id === updatedImage.id ? updatedImage : img))
      );
      onImagesChange?.();
    } catch (error) {
      console.error('Failed to re-crop image:', error);
    } finally {
      setReCropImage(null);
    }
  };

  const handleReCropCancel = () => {
    setReCropImage(null);
  };

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[...Array(6)].map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
            <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (images.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          No photos yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload your first progress photo to get started
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {images.length} photo{images.length !== 1 ? 's' : ''}
        </Typography>
        <ToggleButtonGroup
          value={sortOrder}
          exclusive
          onChange={(_, value) => value && setSortOrder(value)}
          size="small"
        >
          <ToggleButton value="newest">
            <ArrowDownward fontSize="small" sx={{ mr: 0.5 }} />
            Newest
          </ToggleButton>
          <ToggleButton value="oldest">
            <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} />
            Oldest
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={2}>
        {images.map((image) => (
          <Grid key={image.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <ImageCard
              image={image}
              onDelete={handleDeleteClick}
              onSelect={onSelectForCompare}
              onReCrop={handleReCrop}
              selected={selectedIds.includes(image.id)}
              selectable={selectable}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Photo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this photo? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {reCropImage && reCropImage.originalImageData && (
        <ImageCropper
          imageSrc={reCropImage.originalImageData}
          onCropComplete={handleReCropComplete}
          onCancel={handleReCropCancel}
        />
      )}
    </Box>
  );
}
