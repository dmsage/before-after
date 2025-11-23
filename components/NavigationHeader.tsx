'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Compare,
  PhotoLibrary,
  FitnessCenter,
  Brightness4,
  Brightness7,
  MoreVert,
  Download,
  Upload,
} from '@mui/icons-material';
import Link from 'next/link';
import { useColorMode } from '@/app/providers';
import { exportData, importData } from '@/lib/storage';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Upload', href: '/upload', icon: <CloudUpload /> },
  { label: 'Gallery', href: '/gallery', icon: <PhotoLibrary /> },
  { label: 'Compare', href: '/compare', icon: <Compare /> },
];

export default function NavigationHeader() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { toggleColorMode, mode } = useColorMode();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleExport = async () => {
    handleMenuClose();
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weight-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Backup exported successfully', severity: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      setSnackbar({ open: true, message: 'Failed to export backup', severity: 'error' });
    }
  };

  const handleImport = async () => {
    handleMenuClose();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const count = await importData(data);
        setSnackbar({ open: true, message: `Imported ${count} photos successfully`, severity: 'success' });
        // Reload page to show imported data
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        setSnackbar({ open: true, message: 'Failed to import backup', severity: 'error' });
      }
    };
    input.click();
  };

  return (
    <>
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo / Title */}
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FitnessCenter color="primary" />
            {!isMobile && (
              <Typography variant="h6" fontWeight="bold">
                Progress Tracker
              </Typography>
            )}
          </Stack>
        </Link>

        {/* Navigation Items */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            if (isMobile) {
              return (
                <IconButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  color={isActive ? 'primary' : 'default'}
                  title={item.label}
                >
                  {item.icon}
                </IconButton>
              );
            }

            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                startIcon={item.icon}
                variant={isActive ? 'contained' : 'text'}
                color={isActive ? 'primary' : 'inherit'}
                size="small"
              >
                {item.label}
              </Button>
            );
          })}

          {/* Theme Toggle */}
          <IconButton
            onClick={toggleColorMode}
            title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* More Menu */}
          <IconButton
            onClick={handleMenuOpen}
            title="More options"
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>

    {/* Menu */}
    <Menu
      anchorEl={menuAnchor}
      open={Boolean(menuAnchor)}
      onClose={handleMenuClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <MenuItem onClick={handleImport}>
        <ListItemIcon>
          <Upload fontSize="small" />
        </ListItemIcon>
        <ListItemText>Import Backup</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleExport}>
        <ListItemIcon>
          <Download fontSize="small" />
        </ListItemIcon>
        <ListItemText>Export Backup</ListItemText>
      </MenuItem>
    </Menu>

    {/* Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
    >
      <Alert
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        severity={snackbar.severity}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
}
