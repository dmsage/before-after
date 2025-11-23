'use client';

import { ReactNode, createContext, useContext } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

interface ColorModeContextType {
  toggleColorMode: () => void;
  mode: 'light' | 'dark' | 'system';
}

const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
  mode: 'system',
});

export const useColorMode = () => useContext(ColorModeContext);

function ColorModeProvider({ children }: { children: ReactNode }) {
  const { mode, setMode } = useColorScheme();

  const toggleColorMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode: mode || 'system' }}>
      {children}
    </ColorModeContext.Provider>
  );
}

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#2196f3',
        },
        secondary: {
          main: '#f50057',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#90caf9',
        },
        secondary: {
          main: '#f48fb1',
        },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <ColorModeProvider>{children}</ColorModeProvider>
    </ThemeProvider>
  );
}
