import { createTheme, alpha } from '@mui/material/styles';

const SUCCESS = '#10b981';
const WARNING = '#f59e0b';
const ERROR = '#ef4444';
const INFO = '#3b82f6';

export const createBubbleTheme = (colorPreset) => {
  const PRIMARY = colorPreset.primary;
  const SECONDARY = colorPreset.secondary;
  const PRIMARY_LIGHT = colorPreset.light;
  const PRIMARY_DARK = colorPreset.dark;

  return createTheme({
    palette: {
      primary: { main: PRIMARY, light: PRIMARY_LIGHT, dark: PRIMARY_DARK, contrastText: '#fff' },
      secondary: { main: SECONDARY, light: alpha(SECONDARY, 0.7), dark: PRIMARY_DARK, contrastText: '#fff' },
      success: { main: SUCCESS, light: '#34d399', dark: '#059669' },
      warning: { main: WARNING, light: '#fbbf24', dark: '#d97706' },
      error: { main: ERROR, light: '#f87171', dark: '#dc2626' },
      info: { main: INFO, light: '#60a5fa', dark: '#2563eb' },
      background: { default: '#f8fafc', paper: '#ffffff' },
      text: { primary: '#1e293b', secondary: '#64748b' },
      divider: '#e2e8f0',
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, '@media (max-width:600px)': { fontSize: '1.75rem' } },
      h2: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.2, '@media (max-width:600px)': { fontSize: '1.5rem' } },
      h3: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25, '@media (max-width:600px)': { fontSize: '1.35rem' } },
      h4: { fontWeight: 700, letterSpacing: '-0.01em', '@media (max-width:600px)': { fontSize: '1.15rem' } },
      h5: { fontWeight: 600, letterSpacing: '-0.005em', '@media (max-width:600px)': { fontSize: '1.05rem' } },
      h6: { fontWeight: 600, fontSize: '1.05rem', '@media (max-width:600px)': { fontSize: '0.95rem' } },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
      body2: { color: '#64748b', lineHeight: 1.6 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
      overline: { fontWeight: 700, letterSpacing: '0.08em' },
    },
    shape: { borderRadius: 16 },
    shadows: [
      'none',
      `0 2px 8px ${alpha(PRIMARY, 0.08)}`,
      `0 4px 12px ${alpha(PRIMARY, 0.10)}`,
      `0 6px 16px ${alpha(PRIMARY, 0.12)}`,
      `0 8px 24px ${alpha(PRIMARY, 0.14)}`,
      `0 12px 32px ${alpha(PRIMARY, 0.16)}`,
      `0 16px 40px ${alpha(PRIMARY, 0.20)}`,
      ...Array(18).fill(`0 16px 40px ${alpha(PRIMARY, 0.20)}`),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { boxSizing: 'border-box' },
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: 6, height: 6 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 10 },
          },
          /* ── Global Mobile Responsive Rules ───────────── */
          /* Prevent hover effects on touch devices */
          '@media (hover: none)': {
            '.MuiCard-root:hover': {
              transform: 'none !important',
            },
            '.MuiButton-contained:hover': {
              transform: 'none !important',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, borderRadius: 50, padding: '10px 24px',
            '@media (max-width:600px)': { padding: '8px 16px', fontSize: '0.8rem' },
          },
          contained: {
            transition: 'all 0.25s ease',
            boxShadow: `0 4px 14px ${alpha(PRIMARY, 0.35)}`,
            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${alpha(PRIMARY, 0.45)}` },
          },
          outlined: { borderWidth: 2, borderRadius: 50, '&:hover': { borderWidth: 2 } },
          sizeSmall: { borderRadius: 50, padding: '6px 16px', '@media (max-width:600px)': { padding: '4px 12px', fontSize: '0.75rem' } },
          sizeLarge: { borderRadius: 50, padding: '12px 32px', '@media (max-width:600px)': { padding: '10px 20px' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            border: '1px solid #f1f5f9',
            boxShadow: `0 2px 12px ${alpha(PRIMARY, 0.06)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 8px 30px ${alpha(PRIMARY, 0.12)}`,
              transform: 'translateY(-2px)',
            },
            '@media (max-width:600px)': {
              borderRadius: 16,
            },
            '@media (hover: none)': {
              '&:hover': { transform: 'none', boxShadow: `0 2px 12px ${alpha(PRIMARY, 0.06)}` },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 24, backgroundImage: 'none',
            '@media (max-width:600px)': { borderRadius: 16 },
          },
          elevation1: { boxShadow: `0 2px 12px ${alpha(PRIMARY, 0.06)}` },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 16,
              backgroundColor: '#f8fafc',
              transition: 'all 0.2s ease',
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
              '&.Mui-focused': { backgroundColor: '#fff' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
              '@media (max-width:600px)': { borderRadius: 12 },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 50, fontSize: '0.75rem' },
          filled: {
            '&.MuiChip-colorSuccess': { backgroundColor: alpha(SUCCESS, 0.12), color: '#059669' },
            '&.MuiChip-colorWarning': { backgroundColor: alpha(WARNING, 0.12), color: '#d97706' },
            '&.MuiChip-colorError': { backgroundColor: alpha(ERROR, 0.12), color: '#dc2626' },
            '&.MuiChip-colorInfo': { backgroundColor: alpha(INFO, 0.12), color: '#2563eb' },
            '&.MuiChip-colorPrimary': { backgroundColor: alpha(PRIMARY, 0.12), color: PRIMARY_DARK },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '2px solid #e2e8f0',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': { backgroundColor: alpha(PRIMARY, 0.03) },
            '&:last-of-type td': { borderBottom: 0 },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#f1f5f9', padding: '12px 16px',
            '@media (max-width:600px)': { padding: '8px 10px', fontSize: '0.78rem' },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 48, borderRadius: '16px 16px 0 0',
            '@media (max-width:600px)': { fontSize: '0.78rem', minHeight: 40, padding: '6px 12px', minWidth: 'auto' },
          },
        },
      },
      MuiTabs: {
        defaultProps: { variant: 'scrollable', scrollButtons: 'auto', allowScrollButtonsMobile: true },
        styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28, boxShadow: `0 25px 60px ${alpha(PRIMARY, 0.2)}`,
            '@media (max-width:600px)': {
              borderRadius: 16, margin: 16, maxHeight: 'calc(100% - 32px)',
              width: 'calc(100% - 32px) !important', maxWidth: '100% !important',
            },
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.125rem', fontWeight: 700, padding: '20px 24px 12px',
            '@media (max-width:600px)': { padding: '16px 16px 8px', fontSize: '1rem' },
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { '@media (max-width:600px)': { padding: '8px 16px' } },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { '@media (max-width:600px)': { padding: '8px 16px 16px' } },
        },
      },
      MuiAvatar: {
        styleOverrides: { root: { fontWeight: 600, fontSize: '0.875rem' } },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 14, transition: 'all 0.2s', '&:hover': { backgroundColor: alpha(PRIMARY, 0.08) } },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 10, height: 8 }, bar: { borderRadius: 10 } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { borderRadius: 14, fontSize: '0.75rem', fontWeight: 500, padding: '8px 14px' } },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
        },
      },
      MuiGrid: {
        styleOverrides: {
          root: { '@media (max-width:600px)': { '&.MuiGrid-spacing-xs-3': { margin: '-8px', '& > .MuiGrid-item': { padding: '8px' } } } },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 16 } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            margin: '2px 0',
            '&.Mui-selected': {
              backgroundColor: alpha(PRIMARY, 0.08),
              color: PRIMARY,
              '& .MuiListItemIcon-root': { color: PRIMARY },
              '&:hover': { backgroundColor: alpha(PRIMARY, 0.12) },
            },
          },
        },
      },
    },
  });
};

// Default export for backward compatibility
export const theme = createBubbleTheme({
  name: 'Indigo', primary: '#6366f1', secondary: '#8b5cf6', light: '#818cf8', dark: '#4f46e5',
});
