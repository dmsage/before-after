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
} from '@mui/material';
import { ZoomIn, ZoomOut, RestartAlt } from '@mui/icons-material';
import { ProgressImage } from '@/types';
import { formatDate, getDateDifference } from '@/lib/dateUtils';

interface ComparisonViewProps {
  image1: ProgressImage | null;
  image2: ProgressImage | null;
}

interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

export default function ComparisonView({ image1, image2 }: ComparisonViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [zoom1, setZoom1] = useState<ZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const [zoom2, setZoom2] = useState<ZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeImage, setActiveImage] = useState<1 | 2 | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleZoomIn = (imageNum: 1 | 2) => {
    const setZoom = imageNum === 1 ? setZoom1 : setZoom2;
    setZoom((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.5, 4) }));
  };

  const handleZoomOut = (imageNum: 1 | 2) => {
    const setZoom = imageNum === 1 ? setZoom1 : setZoom2;
    setZoom((prev) => ({
      scale: Math.max(prev.scale - 0.5, 1),
      translateX: prev.scale <= 1.5 ? 0 : prev.translateX,
      translateY: prev.scale <= 1.5 ? 0 : prev.translateY,
    }));
  };

  const handleReset = (imageNum: 1 | 2) => {
    const setZoom = imageNum === 1 ? setZoom1 : setZoom2;
    setZoom({ scale: 1, translateX: 0, translateY: 0 });
  };

  const handleMouseDown = (e: MouseEvent, imageNum: 1 | 2) => {
    const zoom = imageNum === 1 ? zoom1 : zoom2;
    if (zoom.scale > 1) {
      setIsDragging(true);
      setActiveImage(imageNum);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !activeImage) return;

    const setZoom = activeImage === 1 ? setZoom1 : setZoom2;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    setZoom((prev) => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveImage(null);
  };

  const handleTouchStart = (e: TouchEvent, imageNum: 1 | 2) => {
    const zoom = imageNum === 1 ? zoom1 : zoom2;
    if (zoom.scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setActiveImage(imageNum);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !activeImage || e.touches.length !== 1) return;

    const setZoom = activeImage === 1 ? setZoom1 : setZoom2;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;

    setZoom((prev) => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));

    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setActiveImage(null);
  };

  if (!image1 && !image2) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          Select two photos to compare
        </Typography>
      </Box>
    );
  }

  const timeDiff = image1 && image2 ? getDateDifference(image1.date, image2.date) : null;

  const renderImagePanel = (
    image: ProgressImage | null,
    zoom: ZoomState,
    imageNum: 1 | 2,
    label: string
  ) => (
    <Paper
      elevation={2}
      sx={{
        flex: 1,
        minHeight: isMobile ? 250 : 400,
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
                <Typography variant="subtitle2" fontWeight="bold">
                  {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(image.date)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={() => handleZoomOut(imageNum)} disabled={zoom.scale <= 1}>
                  <ZoomOut fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleZoomIn(imageNum)} disabled={zoom.scale >= 4}>
                  <ZoomIn fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleReset(imageNum)} disabled={zoom.scale === 1}>
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
            onMouseDown={(e) => handleMouseDown(e, imageNum)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => handleTouchStart(e, imageNum)}
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

  return (
    <Box>
      {timeDiff && (
        <Box textAlign="center" mb={2}>
          <Typography variant="h6" color="primary">
            {timeDiff.formatted}
          </Typography>
        </Box>
      )}

      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        sx={{ minHeight: isMobile ? 'auto' : 450 }}
      >
        {renderImagePanel(image1, zoom1, 1, 'Before')}
        {renderImagePanel(image2, zoom2, 2, 'After')}
      </Stack>
    </Box>
  );
}
