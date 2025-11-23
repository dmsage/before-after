'use client';

import { useState, useRef, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { CloudUpload, Check } from '@mui/icons-material';
import { compressImage, validateImageType, getAcceptedTypes, generateImageId, formatFileSize } from '@/lib/imageUtils';
import { saveImage } from '@/lib/storage';
import { getTodayDate } from '@/lib/dateUtils';
import { ProgressImage } from '@/types';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(false);
    setCompressionInfo(null);

    if (!file) return;

    if (!validateImageType(file)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) return;

    setIsUploading(true);
    setError(null);

    try {
      const { data, mimeType, size } = await compressImage(selectedFile);

      const image: ProgressImage = {
        id: generateImageId(),
        imageData: data,
        date,
        uploadTimestamp: Date.now(),
        mimeType,
        fileName: selectedFile.name,
        fileSize: size,
      };

      await saveImage(image);

      setCompressionInfo({
        original: selectedFile.size,
        compressed: size,
      });

      setSuccess(true);
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6">Upload Progress Photo</Typography>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess(false)}>
              Photo uploaded successfully!
              {compressionInfo && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Compressed from {formatFileSize(compressionInfo.original)} to {formatFileSize(compressionInfo.compressed)}
                </Typography>
              )}
            </Alert>
          )}

          <TextField
            type="date"
            label="Photo Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Box>
            <input
              type="file"
              accept={getAcceptedTypes()}
              onChange={handleFileSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<CloudUpload />}
                fullWidth
              >
                Select Image
              </Button>
            </label>
          </Box>

          {preview && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Preview:
              </Typography>
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              {selectedFile && (
                <Typography variant="caption" color="text.secondary">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              )}
            </Box>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              startIcon={isUploading ? <CircularProgress size={20} /> : <Check />}
              fullWidth
            >
              {isUploading ? 'Uploading...' : 'Save Photo'}
            </Button>
            {preview && (
              <Button variant="outlined" onClick={handleReset}>
                Clear
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
