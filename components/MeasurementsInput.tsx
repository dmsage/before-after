'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  InputAdornment,
} from '@mui/material';
import { ExpandMore, Straighten } from '@mui/icons-material';
import { BodyMeasurements } from '@/types';

interface MeasurementsInputProps {
  value: BodyMeasurements;
  onChange: (measurements: BodyMeasurements) => void;
}

interface MeasurementField {
  key: keyof BodyMeasurements;
  label: string;
  hint: string;
}

const measurementFields: MeasurementField[] = [
  { key: 'chest', label: 'Chest/Bust', hint: 'Around the fullest part' },
  { key: 'shoulders', label: 'Shoulders', hint: 'Around the widest part' },
  { key: 'upperArm', label: 'Upper Arm', hint: 'Around the bicep' },
  { key: 'waist', label: 'Waist', hint: 'At the narrowest point' },
  { key: 'belly', label: 'Belly', hint: 'Around the navel' },
  { key: 'hips', label: 'Hips', hint: 'At the widest point' },
  { key: 'thigh', label: 'Thigh', hint: 'At the thickest point' },
  { key: 'calf', label: 'Calf', hint: 'At the widest point' },
];

export default function MeasurementsInput({ value, onChange }: MeasurementsInputProps) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: keyof BodyMeasurements, inputValue: string) => {
    const numValue = inputValue === '' ? undefined : parseFloat(inputValue);
    onChange({
      ...value,
      [key]: numValue,
    });
  };

  const filledCount = Object.values(value).filter((v) => v !== undefined && v !== null).length;

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{
        '&:before': { display: 'none' },
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '&.Mui-expanded': {
          margin: 0,
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          '&.Mui-expanded': {
            minHeight: 48,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Straighten fontSize="small" color="action" />
          <Typography variant="body2">
            Body Measurements (Optional)
            {filledCount > 0 && (
              <Typography component="span" variant="caption" color="primary" sx={{ ml: 1 }}>
                {filledCount} recorded
              </Typography>
            )}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          All measurements in centimeters (cm). Leave blank to skip.
        </Typography>
        <Grid container spacing={2}>
          {measurementFields.map((field) => (
            <Grid size={{ xs: 6 }} key={field.key}>
              <TextField
                label={field.label}
                type="number"
                size="small"
                fullWidth
                value={value[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.hint}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  },
                  htmlInput: {
                    min: 0,
                    max: 500,
                    step: 0.1,
                  },
                }}
              />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
