'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
} from '@mui/material';
import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Upload Photo
        </Typography>
        <UploadForm onUploadSuccess={() => router.push('/gallery')} />
      </Container>
    </Box>
  );
}
