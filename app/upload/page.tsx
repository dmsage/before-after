'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  useColorScheme,
} from '@mui/material';
import { ArrowBack, DarkMode, LightMode } from '@mui/icons-material';
import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  const router = useRouter();
  const { mode, setMode } = useColorScheme();

  const toggleColorMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Upload Photo
          </Typography>
          <IconButton onClick={toggleColorMode} title="Toggle theme">
            {mode === 'dark' ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <UploadForm onUploadSuccess={() => router.push('/gallery')} />
      </Container>
    </Box>
  );
}
