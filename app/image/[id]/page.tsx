'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Stack,
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Delete,
  Compare,
  Crop,
  CalendarToday,
  Storage,
  ZoomIn,
  ZoomOut,
  Close,
  Edit,
} from '@mui/icons-material';
import { ProgressImage, BodyMeasurements } from '@/types';
import { getImage, deleteImage, saveImage } from '@/lib/storage';
import { formatDate } from '@/lib/dateUtils';
import { formatFileSize } from '@/lib/imageUtils';
import { compressCroppedImage, CropArea } from '@/lib/cropUtils';
import MeasurementsDisplay from '@/components/MeasurementsDisplay';
import MeasurementsInput from '@/components/MeasurementsInput';
import ImageCropper from '@/components/ImageCropper';

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const imageId = params.id as string;

  const [image, setImage] = useState<ProgressImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [editMeasurementsOpen, setEditMeasurementsOpen] = useState(false);
  const [editingMeasurements, setEditingMeasurements] = useState<BodyMeasurements>({});

  useEffect(() => {
    loadImage();
  }, [imageId]);

  const loadImage = async () => {
    setLoading(true);
    try {
      const img = await getImage(imageId);
      setImage(img || null);
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteImage(imageId);
      router.push('/gallery');
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleCompare = () => {
    router.push(`/compare?id=${imageId}`);
  };

  const handleReCrop = () => {
    if (image?.originalImageData) {
      setShowCropper(true);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob, cropArea: CropArea) => {
    if (!image) return;

    try {
      const { data, size } = await compressCroppedImage(croppedBlob);

      const updatedImage: ProgressImage = {
        ...image,
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
      setImage(updatedImage);
    } catch (error) {
      console.error('Failed to re-crop image:', error);
    } finally {
      setShowCropper(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoom(1);

  const handleEditMeasurements = () => {
    if (image) {
      setEditingMeasurements(image.measurements || {});
      setEditMeasurementsOpen(true);
    }
  };

  const handleSaveMeasurements = async () => {
    if (!image) return;

    try {
      const filteredMeasurements = Object.fromEntries(
        Object.entries(editingMeasurements).filter(([, v]) => v !== undefined && v !== null)
      ) as BodyMeasurements;

      const updatedImage: ProgressImage = {
        ...image,
        measurements: Object.keys(filteredMeasurements).length > 0 ? filteredMeasurements : undefined,
      };

      await saveImage(updatedImage);
      setImage(updatedImage);
      setEditMeasurementsOpen(false);
    } catch (error) {
      console.error('Failed to save measurements:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" height={30} />
        </Stack>
      </Container>
    );
  }

  if (!image) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Image not found
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/gallery')}
          >
            Back to Gallery
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/gallery')}
            color="inherit"
          >
            Back to Gallery
          </Button>
          <Stack direction="row" spacing={1}>
            {image.originalImageData && (
              <IconButton onClick={handleReCrop} title="Re-crop">
                <Crop />
              </IconButton>
            )}
            <IconButton onClick={handleCompare} title="Compare">
              <Compare />
            </IconButton>
            <IconButton
              onClick={() => setDeleteDialogOpen(true)}
              color="error"
              title="Delete"
            >
              <Delete />
            </IconButton>
          </Stack>
        </Stack>

        {/* Image */}
        <Paper
          elevation={2}
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 4,
            },
          }}
          onClick={() => setFullViewOpen(true)}
        >
          <Box
            component="img"
            src={image.imageData}
            alt={`Progress photo from ${image.date}`}
            sx={{
              width: '100%',
              maxHeight: 500,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Paper>

        {/* Details */}
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight="bold">
              {formatDate(image.date)}
            </Typography>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                icon={<CalendarToday />}
                label={image.date}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<Storage />}
                label={formatFileSize(image.fileSize)}
                variant="outlined"
                size="small"
              />
              {image.cropSettings && (
                <Chip
                  icon={<Crop />}
                  label="Cropped"
                  variant="outlined"
                  size="small"
                  color="primary"
                />
              )}
            </Stack>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Body Measurements
                </Typography>
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={handleEditMeasurements}
                >
                  {image.measurements && Object.keys(image.measurements).length > 0 ? 'Edit' : 'Add'}
                </Button>
              </Stack>
              {image.measurements && Object.keys(image.measurements).length > 0 ? (
                <MeasurementsDisplay measurements={image.measurements} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No measurements recorded
                </Typography>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary">
              Uploaded: {new Date(image.uploadTimestamp).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Original file: {image.fileName}
            </Typography>
          </Stack>
        </Paper>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Photo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this photo? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full View Dialog */}
      <Dialog
        open={fullViewOpen}
        onClose={() => {
          setFullViewOpen(false);
          handleResetZoom();
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'black', m: 1 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            display: 'flex',
            gap: 1,
          }}
        >
          <IconButton
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            <ZoomOut />
          </IconButton>
          <IconButton
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            <ZoomIn />
          </IconButton>
          <IconButton
            onClick={() => {
              setFullViewOpen(false);
              handleResetZoom();
            }}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            <Close />
          </IconButton>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            overflow: 'auto',
            p: 2,
          }}
        >
          <Box
            component="img"
            src={image.imageData}
            alt={`Progress photo from ${image.date}`}
            sx={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease',
            }}
          />
        </Box>
      </Dialog>

      {/* Re-crop Dialog */}
      {showCropper && image.originalImageData && (
        <ImageCropper
          imageSrc={image.originalImageData}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}

      {/* Edit Measurements Dialog */}
      <Dialog
        open={editMeasurementsOpen}
        onClose={() => setEditMeasurementsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Measurements</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <MeasurementsInput
              value={editingMeasurements}
              onChange={setEditingMeasurements}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMeasurementsOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMeasurements} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
