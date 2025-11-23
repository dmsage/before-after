'use client';

import { useState, useRef, MouseEvent, TouchEvent } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
  Grid,
} from '@mui/material';
import { ZoomIn, ZoomOut, RestartAlt } from '@mui/icons-material';
import { ProgressImage } from '@/types';
import { formatDate } from '@/lib/dateUtils';
import { MeasurementsCompareMultiple } from './MeasurementsDisplay';

interface ComparisonViewProps {
  images: (ProgressImage | null)[];
}

interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

export default function ComparisonView({ images }: ComparisonViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [zoomStates, setZoomStates] = useState<ZoomState[]>([
    { scale: 1, translateX: 0, translateY: 0 },
    { scale: 1, translateX: 0, translateY: 0 },
    { scale: 1, translateX: 0, translateY: 0 },
    { scale: 1, translateX: 0, translateY: 0 },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleZoomIn = (index: number) => {
    setZoomStates(prev => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], scale: Math.min(newStates[index].scale + 0.5, 4) };
      return newStates;
    });
  };

  const handleZoomOut = (index: number) => {
    setZoomStates(prev => {
      const newStates = [...prev];
      const currentScale = newStates[index].scale;
      newStates[index] = {
        scale: Math.max(currentScale - 0.5, 1),
        translateX: currentScale <= 1.5 ? 0 : newStates[index].translateX,
        translateY: currentScale <= 1.5 ? 0 : newStates[index].translateY,
      };
      return newStates;
    });
  };

  const handleReset = (index: number) => {
    setZoomStates(prev => {
      const newStates = [...prev];
      newStates[index] = { scale: 1, translateX: 0, translateY: 0 };
      return newStates;
    });
  };

  const handleMouseDown = (e: MouseEvent, index: number) => {
    const zoom = zoomStates[index];
    if (zoom.scale > 1) {
      setIsDragging(true);
      setActiveImage(index);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || activeImage === null) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    setZoomStates(prev => {
      const newStates = [...prev];
      newStates[activeImage] = {
        ...newStates[activeImage],
        translateX: newStates[activeImage].translateX + dx,
        translateY: newStates[activeImage].translateY + dy,
      };
      return newStates;
    });

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveImage(null);
  };

  const handleTouchStart = (e: TouchEvent, index: number) => {
    const zoom = zoomStates[index];
    if (zoom.scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setActiveImage(index);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || activeImage === null || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;

    setZoomStates(prev => {
      const newStates = [...prev];
      newStates[activeImage] = {
        ...newStates[activeImage],
        translateX: newStates[activeImage].translateX + dx,
        translateY: newStates[activeImage].translateY + dy,
      };
      return newStates;
    });

    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setActiveImage(null);
  };

  const activeImages = images.filter((img): img is ProgressImage => img !== null);

  if (activeImages.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          Select photos to compare (up to 4)
        </Typography>
      </Box>
    );
  }

  const renderImagePanel = (
    image: ProgressImage | null,
    index: number
  ) => {
    const zoom = zoomStates[index];

    return (
      <Paper
        elevation={2}
        sx={{
          height: '100%',
          minHeight: isMobile ? 200 : 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {image ? (
          <>
            <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(image.date)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => handleZoomOut(index)} disabled={zoom.scale <= 1}>
                    <ZoomOut fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleZoomIn(index)} disabled={zoom.scale >= 4}>
                    <ZoomIn fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleReset(index)} disabled={zoom.scale === 1}>
                    <RestartAlt fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
                cursor: zoom.scale > 1 ? 'grab' : 'default',
                '&:active': {
                  cursor: zoom.scale > 1 ? 'grabbing' : 'default',
                },
              }}
              onMouseDown={(e) => handleMouseDown(e, index)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Box
                component="img"
                src={image.imageData}
                alt={`Photo from ${image.date}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoom.scale}) translate(${zoom.translateX / zoom.scale}px, ${zoom.translateY / zoom.scale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">Select a photo</Typography>
          </Box>
        )}
      </Paper>
    );
  };

  // Determine grid layout based on number of images
  const getGridSize = () => {
    if (activeImages.length <= 2) {
      return { xs: 12, sm: 6 };
    }
    return { xs: 6, sm: 6, md: 3 };
  };

  const gridSize = getGridSize();

  return (
    <Box>
      <Grid container spacing={2}>
        {images.map((image, index) => {
          // Only show slots that have images or are needed for the layout
          if (!image && index >= activeImages.length) return null;

          return (
            <Grid key={index} size={gridSize}>
              {renderImagePanel(image, index)}
            </Grid>
          );
        })}
      </Grid>

      {activeImages.some(img => img.measurements) && (
        <Paper elevation={1} sx={{ mt: 2, p: 2 }}>
          <MeasurementsCompareMultiple images={activeImages} />
        </Paper>
      )}
    </Box>
  );
}
