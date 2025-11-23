'use client';

import { Box, Chip, Stack, Typography } from '@mui/material';
import { QuickCompareOption } from '@/types';

interface QuickCompareProps {
  onSelect: (days: number) => void;
  disabled?: boolean;
}

const quickCompareOptions: QuickCompareOption[] = [
  { label: '1 week ago', days: 7 },
  { label: '2 weeks ago', days: 14 },
  { label: '1 month ago', days: 30 },
  { label: '3 months ago', days: 90 },
  { label: '6 months ago', days: 180 },
  { label: '1 year ago', days: 365 },
];

export default function QuickCompare({ onSelect, disabled = false }: QuickCompareProps) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Quick compare with:
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {quickCompareOptions.map((option) => (
          <Chip
            key={option.days}
            label={option.label}
            onClick={() => onSelect(option.days)}
            disabled={disabled}
            clickable
            variant="outlined"
            size="small"
          />
        ))}
      </Stack>
    </Box>
  );
}
