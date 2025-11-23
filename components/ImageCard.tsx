'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Checkbox,
} from '@mui/material';
import { Delete, Compare, Crop } from '@mui/icons-material';
import { ProgressImage } from '@/types';
import { formatDate, formatDateShort } from '@/lib/dateUtils';
import { formatFileSize } from '@/lib/imageUtils';
import MeasurementsDisplay from './MeasurementsDisplay';

interface ImageCardProps {
  image: ProgressImage;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
  onReCrop?: (image: ProgressImage) => void;
  selected?: boolean;
  selectable?: boolean;
  compact?: boolean;
}

export default function ImageCard({
  image,
  onDelete,
  onSelect,
  onReCrop,
  selected = false,
  selectable = false,
  compact = false,
}: ImageCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (selectable) {
      onSelect?.(image.id);
    } else {
      router.push(`/image/${image.id}`);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        border: selected ? 2 : 0,
        borderColor: 'primary.main',
        '&:hover': !compact ? {
          boxShadow: 4,
        } : {},
      }}
      onClick={handleCardClick}
    >
      {selectable && (
        <Checkbox
          checked={selected}
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            zIndex: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'background.paper',
            },
          }}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onSelect?.(image.id)}
        />
      )}

      <CardMedia
        component="img"
        image={image.imageData}
        alt={`Progress photo from ${image.date}`}
        sx={{
          height: compact ? 150 : 200,
          objectFit: 'cover',
        }}
      />

      <CardContent sx={{ flexGrow: 1, py: compact ? 1 : 2 }}>
        <Typography variant={compact ? 'body2' : 'subtitle1'} fontWeight="bold">
          {compact ? formatDateShort(image.date) : formatDate(image.date)}
        </Typography>
        {!compact && (
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(image.fileSize)}
          </Typography>
        )}
        {image.measurements && (
          <MeasurementsDisplay measurements={image.measurements} compact={compact} />
        )}
      </CardContent>

      {(onDelete || onSelect || onReCrop) && !compact && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          {onReCrop && image.originalImageData && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReCrop(image);
              }}
              title="Re-crop"
            >
              <Crop />
            </IconButton>
          )}
          {onSelect && !selectable && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(image.id);
              }}
              title="Compare"
            >
              <Compare />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              title="Delete"
            >
              <Delete />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
}
