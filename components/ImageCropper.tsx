'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Crop,
  Close,
  Check,
  CropSquare,
  CropPortrait,
  CropLandscape,
  CropFree,
} from '@mui/icons-material';
import { getCroppedImg, CropArea } from '@/lib/cropUtils';

interface AspectRatioOption {
  label: string;
  value: string;
  ratio: number | undefined;
  icon: React.ReactNode;
}

const aspectRatioOptions: AspectRatioOption[] = [
  { label: 'Free', value: 'free', ratio: undefined, icon: <CropFree fontSize="small" /> },
  { label: '1:1', value: '1:1', ratio: 1, icon: <CropSquare fontSize="small" /> },
  { label: '3:4', value: '3:4', ratio: 3 / 4, icon: <CropPortrait fontSize="small" /> },
  { label: '4:3', value: '4:3', ratio: 4 / 3, icon: <CropLandscape fontSize="small" /> },
];

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, cropArea: CropArea) => void;
  onCancel: () => void;
  initialCrop?: Point;
  initialZoom?: number;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  initialCrop = { x: 0, y: 0 },
  initialZoom = 1,
}: ImageCropperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [crop, setCrop] = useState<Point>(initialCrop);
  const [zoom, setZoom] = useState(initialZoom);
  const [aspectRatioKey, setAspectRatioKey] = useState<string>('free');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Freeform crop state
  const [freeformCrop, setFreeformCrop] = useState<CropRect>({ x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialRect, setInitialRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  const currentAspectRatio = aspectRatioOptions.find((o) => o.value === aspectRatioKey)?.ratio;
  const isFreeForm = aspectRatioKey === 'free';

  // Calculate image dimensions within container
  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return;

    const img = new Image();
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imgAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;

      let displayWidth, displayHeight, offsetX, offsetY;

      if (imgAspect > containerAspect) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imgAspect;
        offsetX = 0;
        offsetY = (containerHeight - displayHeight) / 2;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imgAspect;
        offsetX = (containerWidth - displayWidth) / 2;
        offsetY = 0;
      }

      setImageDimensions({ width: displayWidth, height: displayHeight, offsetX, offsetY });

      // Initialize crop to center of image
      const cropWidth = Math.min(200, displayWidth * 0.8);
      const cropHeight = Math.min(200, displayHeight * 0.8);
      setFreeformCrop({
        x: offsetX + (displayWidth - cropWidth) / 2,
        y: offsetY + (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    };
    img.src = imageSrc;
  }, [imageLoaded, imageSrc]);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaComplete = useCallback((_: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleAspectRatioChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue) {
      setAspectRatioKey(newValue);
    }
  };

  // Convert freeform crop to pixel coordinates for the actual image
  const getFreeformCroppedAreaPixels = useCallback((): CropArea | null => {
    if (!imageDimensions.width || !imageDimensions.height) return null;

    const img = new Image();
    img.src = imageSrc;

    const scaleX = img.width / imageDimensions.width;
    const scaleY = img.height / imageDimensions.height;

    const cropX = (freeformCrop.x - imageDimensions.offsetX) * scaleX;
    const cropY = (freeformCrop.y - imageDimensions.offsetY) * scaleY;
    const cropWidth = freeformCrop.width * scaleX;
    const cropHeight = freeformCrop.height * scaleY;

    return {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(cropWidth, img.width - cropX),
      height: Math.min(cropHeight, img.height - cropY),
    };
  }, [freeformCrop, imageDimensions, imageSrc]);

  const handleApplyCrop = async () => {
    const areaPixels = isFreeForm ? getFreeformCroppedAreaPixels() : croppedAreaPixels;
    if (!areaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, areaPixels);
      onCropComplete(croppedBlob, areaPixels);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      handleApplyCrop();
    }
  }, [onCancel]);

  // Freeform drag handlers
  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialRect({ ...freeformCrop });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragType) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const minSize = 50;

    const { offsetX, offsetY, width: imgWidth, height: imgHeight } = imageDimensions;
    const maxX = offsetX + imgWidth;
    const maxY = offsetY + imgHeight;

    setFreeformCrop((prev) => {
      let newRect = { ...prev };

      switch (dragType) {
        case 'move':
          newRect.x = Math.max(offsetX, Math.min(maxX - prev.width, initialRect.x + dx));
          newRect.y = Math.max(offsetY, Math.min(maxY - prev.height, initialRect.y + dy));
          break;
        case 'nw':
          newRect.width = Math.max(minSize, initialRect.width - dx);
          newRect.height = Math.max(minSize, initialRect.height - dy);
          newRect.x = initialRect.x + initialRect.width - newRect.width;
          newRect.y = initialRect.y + initialRect.height - newRect.height;
          break;
        case 'ne':
          newRect.width = Math.max(minSize, initialRect.width + dx);
          newRect.height = Math.max(minSize, initialRect.height - dy);
          newRect.y = initialRect.y + initialRect.height - newRect.height;
          break;
        case 'sw':
          newRect.width = Math.max(minSize, initialRect.width - dx);
          newRect.height = Math.max(minSize, initialRect.height + dy);
          newRect.x = initialRect.x + initialRect.width - newRect.width;
          break;
        case 'se':
          newRect.width = Math.max(minSize, initialRect.width + dx);
          newRect.height = Math.max(minSize, initialRect.height + dy);
          break;
        case 'n':
          newRect.height = Math.max(minSize, initialRect.height - dy);
          newRect.y = initialRect.y + initialRect.height - newRect.height;
          break;
        case 's':
          newRect.height = Math.max(minSize, initialRect.height + dy);
          break;
        case 'w':
          newRect.width = Math.max(minSize, initialRect.width - dx);
          newRect.x = initialRect.x + initialRect.width - newRect.width;
          break;
        case 'e':
          newRect.width = Math.max(minSize, initialRect.width + dx);
          break;
      }

      // Constrain to image bounds
      newRect.x = Math.max(offsetX, newRect.x);
      newRect.y = Math.max(offsetY, newRect.y);
      newRect.width = Math.min(newRect.width, maxX - newRect.x);
      newRect.height = Math.min(newRect.height, maxY - newRect.y);

      return newRect;
    });
  }, [isDragging, dragType, dragStart, initialRect, imageDimensions]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, type: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setInitialRect({ ...freeformCrop });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragType) return;
      e.preventDefault();

      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;
      const minSize = 50;

      const { offsetX, offsetY, width: imgWidth, height: imgHeight } = imageDimensions;
      const maxX = offsetX + imgWidth;
      const maxY = offsetY + imgHeight;

      setFreeformCrop((prev) => {
        let newRect = { ...prev };

        switch (dragType) {
          case 'move':
            newRect.x = Math.max(offsetX, Math.min(maxX - prev.width, initialRect.x + dx));
            newRect.y = Math.max(offsetY, Math.min(maxY - prev.height, initialRect.y + dy));
            break;
          case 'nw':
            newRect.width = Math.max(minSize, initialRect.width - dx);
            newRect.height = Math.max(minSize, initialRect.height - dy);
            newRect.x = initialRect.x + initialRect.width - newRect.width;
            newRect.y = initialRect.y + initialRect.height - newRect.height;
            break;
          case 'ne':
            newRect.width = Math.max(minSize, initialRect.width + dx);
            newRect.height = Math.max(minSize, initialRect.height - dy);
            newRect.y = initialRect.y + initialRect.height - newRect.height;
            break;
          case 'sw':
            newRect.width = Math.max(minSize, initialRect.width - dx);
            newRect.height = Math.max(minSize, initialRect.height + dy);
            newRect.x = initialRect.x + initialRect.width - newRect.width;
            break;
          case 'se':
            newRect.width = Math.max(minSize, initialRect.width + dx);
            newRect.height = Math.max(minSize, initialRect.height + dy);
            break;
          case 'n':
            newRect.height = Math.max(minSize, initialRect.height - dy);
            newRect.y = initialRect.y + initialRect.height - newRect.height;
            break;
          case 's':
            newRect.height = Math.max(minSize, initialRect.height + dy);
            break;
          case 'w':
            newRect.width = Math.max(minSize, initialRect.width - dx);
            newRect.x = initialRect.x + initialRect.width - newRect.width;
            break;
          case 'e':
            newRect.width = Math.max(minSize, initialRect.width + dx);
            break;
        }

        // Constrain to image bounds
        newRect.x = Math.max(offsetX, newRect.x);
        newRect.y = Math.max(offsetY, newRect.y);
        newRect.width = Math.min(newRect.width, maxX - newRect.x);
        newRect.height = Math.min(newRect.height, maxY - newRect.y);

        return newRect;
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setDragType(null);
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragType, dragStart, initialRect, imageDimensions]);

  const handleStyle = {
    position: 'absolute' as const,
    width: 20,
    height: 20,
    backgroundColor: 'white',
    border: '2px solid #1976d2',
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 10,
  };

  const edgeStyle = {
    position: 'absolute' as const,
    backgroundColor: 'transparent',
    zIndex: 9,
  };

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Crop />
          <Typography variant="h6">Crop Image</Typography>
        </Stack>
        <IconButton onClick={onCancel} size="small">
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            height: isMobile ? 'calc(100vh - 250px)' : 400,
            bgcolor: 'black',
          }}
        >
          {isFreeForm ? (
            <>
              <Box
                component="img"
                src={imageSrc}
                onLoad={() => setImageLoaded(true)}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
              {/* Dark overlay - using 4 boxes instead of clip-path */}
              {imageLoaded && (
                <>
                  {/* Top overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: freeformCrop.y,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Bottom overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: freeformCrop.y + freeformCrop.height,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Left overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: freeformCrop.y,
                      left: 0,
                      width: freeformCrop.x,
                      height: freeformCrop.height,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Right overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: freeformCrop.y,
                      left: freeformCrop.x + freeformCrop.width,
                      right: 0,
                      height: freeformCrop.height,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                </>
              )}
              {/* Crop area */}
              {imageLoaded && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: freeformCrop.x,
                    top: freeformCrop.y,
                    width: freeformCrop.width,
                    height: freeformCrop.height,
                    border: '2px solid white',
                    boxSizing: 'border-box',
                    cursor: 'move',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                  onTouchStart={(e) => handleTouchStart(e, 'move')}
                >

                  {/* Corner handles */}
                  <Box
                    sx={{ ...handleStyle, top: -10, left: -10, cursor: 'nw-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                    onTouchStart={(e) => handleTouchStart(e, 'nw')}
                  />
                  <Box
                    sx={{ ...handleStyle, top: -10, right: -10, cursor: 'ne-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                    onTouchStart={(e) => handleTouchStart(e, 'ne')}
                  />
                  <Box
                    sx={{ ...handleStyle, bottom: -10, left: -10, cursor: 'sw-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                    onTouchStart={(e) => handleTouchStart(e, 'sw')}
                  />
                  <Box
                    sx={{ ...handleStyle, bottom: -10, right: -10, cursor: 'se-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                    onTouchStart={(e) => handleTouchStart(e, 'se')}
                  />

                  {/* Edge handles */}
                  <Box
                    sx={{ ...edgeStyle, top: -5, left: 20, right: 20, height: 10, cursor: 'n-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 'n')}
                    onTouchStart={(e) => handleTouchStart(e, 'n')}
                  />
                  <Box
                    sx={{ ...edgeStyle, bottom: -5, left: 20, right: 20, height: 10, cursor: 's-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 's')}
                    onTouchStart={(e) => handleTouchStart(e, 's')}
                  />
                  <Box
                    sx={{ ...edgeStyle, left: -5, top: 20, bottom: 20, width: 10, cursor: 'w-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 'w')}
                    onTouchStart={(e) => handleTouchStart(e, 'w')}
                  />
                  <Box
                    sx={{ ...edgeStyle, right: -5, top: 20, bottom: 20, width: 10, cursor: 'e-resize' }}
                    onMouseDown={(e) => handleMouseDown(e, 'e')}
                    onTouchStart={(e) => handleTouchStart(e, 'e')}
                  />
                </Box>
              )}
            </>
          ) : (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={currentAspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaComplete}
              showGrid={true}
              zoomSpeed={0.1}
              minZoom={1}
              maxZoom={3}
              cropShape="rect"
              objectFit="contain"
            />
          )}
        </Box>

        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Aspect Ratio Selection */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Aspect Ratio
              </Typography>
              <ToggleButtonGroup
                value={aspectRatioKey}
                exclusive
                onChange={handleAspectRatioChange}
                size="small"
                fullWidth
                sx={{ mt: 0.5 }}
              >
                {aspectRatioOptions.map((option) => (
                  <ToggleButton
                    key={option.label}
                    value={option.value}
                    sx={{ flex: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {option.icon}
                      <Typography variant="caption">{option.label}</Typography>
                    </Stack>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Zoom Control - only for non-freeform modes */}
            {!isFreeForm && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Zoom
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    disabled={zoom <= 1}
                  >
                    <ZoomOut fontSize="small" />
                  </IconButton>
                  <Slider
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(_, value) => setZoom(value as number)}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                    {zoom.toFixed(1)}x
                  </Typography>
                </Stack>
              </Box>
            )}

            {isFreeForm && (
              <Typography variant="caption" color="text.secondary">
                Drag corners or edges to resize. Drag inside to move.
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleApplyCrop}
          variant="contained"
          disabled={isProcessing || (isFreeForm && !imageLoaded)}
          startIcon={isProcessing ? null : <Check />}
        >
          {isProcessing ? 'Processing...' : 'Apply Crop'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
