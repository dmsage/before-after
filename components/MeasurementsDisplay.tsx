'use client';

import {
  Box,
  Typography,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import { BodyMeasurements } from '@/types';

interface MeasurementsDisplayProps {
  measurements: BodyMeasurements;
  compact?: boolean;
}

interface MeasurementInfo {
  key: keyof BodyMeasurements;
  label: string;
  shortLabel: string;
}

const measurementInfo: MeasurementInfo[] = [
  { key: 'chest', label: 'Chest/Bust', shortLabel: 'Chest' },
  { key: 'shoulders', label: 'Shoulders', shortLabel: 'Shoulders' },
  { key: 'upperArm', label: 'Upper Arm', shortLabel: 'Arm' },
  { key: 'waist', label: 'Waist', shortLabel: 'Waist' },
  { key: 'belly', label: 'Belly', shortLabel: 'Belly' },
  { key: 'hips', label: 'Hips', shortLabel: 'Hips' },
  { key: 'thigh', label: 'Thigh', shortLabel: 'Thigh' },
  { key: 'calf', label: 'Calf', shortLabel: 'Calf' },
];

export default function MeasurementsDisplay({ measurements, compact = false }: MeasurementsDisplayProps) {
  const entries = measurementInfo.filter((info) => measurements[info.key] !== undefined);

  if (entries.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Tooltip
        title={
          <Box>
            {entries.map((info) => (
              <Typography key={info.key} variant="caption" display="block">
                {info.label}: {measurements[info.key]} cm
              </Typography>
            ))}
          </Box>
        }
      >
        <Chip
          size="small"
          label={`${entries.length} measurements`}
          variant="outlined"
          sx={{ mt: 0.5, fontSize: '0.65rem', height: 20 }}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight="bold" gutterBottom>
        Measurements
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
        {entries.map((info) => (
          <Chip
            key={info.key}
            size="small"
            label={`${info.shortLabel}: ${measurements[info.key]}`}
            variant="outlined"
            sx={{ fontSize: '0.65rem', height: 20 }}
          />
        ))}
      </Stack>
    </Box>
  );
}

export function MeasurementsCompare({
  measurements1,
  measurements2,
  label1 = 'Before',
  label2 = 'After',
}: {
  measurements1?: BodyMeasurements;
  measurements2?: BodyMeasurements;
  label1?: string;
  label2?: string;
}) {
  const allKeys = new Set([
    ...Object.keys(measurements1 || {}),
    ...Object.keys(measurements2 || {}),
  ]);

  if (allKeys.size === 0) {
    return null;
  }

  const entries = measurementInfo.filter((info) => allKeys.has(info.key));

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Measurements Comparison
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, fontSize: '0.75rem' }}>
        <Typography variant="caption" fontWeight="bold">
          Measurement
        </Typography>
        <Typography variant="caption" fontWeight="bold" textAlign="center">
          {label1}
        </Typography>
        <Typography variant="caption" fontWeight="bold" textAlign="center">
          {label2}
        </Typography>
        {entries.map((info) => {
          const val1 = measurements1?.[info.key];
          const val2 = measurements2?.[info.key];
          const diff = val1 !== undefined && val2 !== undefined ? val2 - val1 : null;

          return (
            <Box key={info.key} sx={{ display: 'contents' }}>
              <Typography variant="caption" color="text.secondary">
                {info.label}
              </Typography>
              <Typography variant="caption" textAlign="center">
                {val1 !== undefined ? `${val1} cm` : '-'}
              </Typography>
              <Typography
                variant="caption"
                textAlign="center"
                sx={{
                  color: diff !== null ? (diff < 0 ? 'success.main' : diff > 0 ? 'error.main' : 'text.primary') : 'text.primary',
                }}
              >
                {val2 !== undefined ? `${val2} cm` : '-'}
                {diff !== null && diff !== 0 && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 0.5, fontSize: '0.65rem' }}
                  >
                    ({diff > 0 ? '+' : ''}{diff.toFixed(1)})
                  </Typography>
                )}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

import { ProgressImage } from '@/types';
import { formatDateShort } from '@/lib/dateUtils';

export function MeasurementsCompareMultiple({ images }: { images: ProgressImage[] }) {
  const allKeys = new Set<string>();
  images.forEach(img => {
    if (img.measurements) {
      Object.keys(img.measurements).forEach(key => allKeys.add(key));
    }
  });

  if (allKeys.size === 0) {
    return null;
  }

  const entries = measurementInfo.filter((info) => allKeys.has(info.key));

  // Calculate grid template based on number of images
  const gridCols = `1fr ${images.map(() => '1fr').join(' ')}`;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Measurements Comparison
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, gap: 1, fontSize: '0.75rem' }}>
        {/* Header row */}
        <Typography variant="caption" fontWeight="bold">
          Measurement
        </Typography>
        {images.map((img) => (
          <Typography key={img.id} variant="caption" fontWeight="bold" textAlign="center">
            {formatDateShort(img.date)}
          </Typography>
        ))}

        {/* Data rows */}
        {entries.map((info) => {
          const values = images.map(img => img.measurements?.[info.key]);
          const firstValue = values[0];

          return (
            <Box key={info.key} sx={{ display: 'contents' }}>
              <Typography variant="caption" color="text.secondary">
                {info.label}
              </Typography>
              {values.map((val, idx) => {
                const diff = firstValue !== undefined && val !== undefined && idx > 0
                  ? val - firstValue
                  : null;

                return (
                  <Typography
                    key={idx}
                    variant="caption"
                    textAlign="center"
                    sx={{
                      color: diff !== null ? (diff < 0 ? 'success.main' : diff > 0 ? 'error.main' : 'text.primary') : 'text.primary',
                    }}
                  >
                    {val !== undefined ? `${val}` : '-'}
                    {diff !== null && diff !== 0 && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 0.5, fontSize: '0.65rem' }}
                      >
                        ({diff > 0 ? '+' : ''}{diff.toFixed(1)})
                      </Typography>
                    )}
                  </Typography>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
