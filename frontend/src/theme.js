import { createTheme, alpha } from '@mui/material/styles';

const SUCCESS = '#14866d';
const WARNING = '#ac6600';
const ERROR = '#d33';
const INFO = '#36c';

export const createBubbleTheme = (colorPreset) => {
  const PRIMARY = colorPreset?.primary || '#36c';
  const SECONDARY = colorPreset?.secondary || '#54595d';
  const PRIMARY_LIGHT = colorPreset?.light || '#447ff5';
  const PRIMARY_DARK = colorPreset?.dark || '#2a4b8d';

  return createTheme({
    palette: {
      primary: { main: PRIMARY, light: PRIMARY_LIGHT, dark: PRIMARY_DARK, contrastText: '#fff' },
      secondary: { main: SECONDARY, light: '#72777d', dark: '#202122', contrastText: '#fff' },
      success: { main: SUCCESS, light: '#00af89', dark: '#14866d' },
      warning: { main: WARNING, light: '#edab00', dark: '#ac6600' },
      error: { main: ERROR, light: '#ff4242', dark: '#b32424' },
      info: { main: INFO, light: '#447ff5', dark: '#2a4b8d' },
      background: { default: '#ffffff', paper: '#ffffff' },
      text: { primary: '#202122', secondary: '#54595d' },
      divider: '#a2a9b1',
    },
    typography: {
      fontFamily: '"Linux Libertine", "Georgia", "Times", "Source Serif Pro", serif',
      h1: { fontWeight: 400, fontSize: '1.8rem', borderBottom: '1px solid #a2a9b1', paddingBottom: '4px', marginBottom: '8px' },
      h2: { fontWeight: 400, fontSize: '1.5rem', borderBottom: '1px solid #a2a9b1', paddingBottom: '4px', marginBottom: '8px' },
      h3: { fontWeight: 700, fontSize: '1.2rem', marginBottom: '4px' },
      h4: { fontWeight: 700, fontSize: '1.1rem' },
      h5: { fontWeight: 700, fontSize: '1rem' },
      h6: { fontWeight: 700, fontSize: '0.95rem' },
      subtitle1: { fontWeight: 400, fontSize: '0.95rem', color: '#54595d' },
      subtitle2: { fontWeight: 400, fontSize: '0.875rem', color: '#54595d' },
      body1: { fontSize: '0.875rem', lineHeight: 1.6, color: '#202122' },
      body2: { fontSize: '0.8125rem', lineHeight: 1.6, color: '#54595d' },
      button: { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem' },
      overline: { fontWeight: 400, letterSpacing: '0.02em', fontSize: '0.75rem' },
    },
    shape: { borderRadius: 2 },
    shadows: [
      'none',
      '0 1px 3px rgba(0,0,0,0.08)',
      '0 1px 4px rgba(0,0,0,0.1)',
      '0 2px 6px rgba(0,0,0,0.1)',
      '0 2px 8px rgba(0,0,0,0.12)',
      '0 3px 10px rgba(0,0,0,0.12)',
      '0 4px 12px rgba(0,0,0,0.15)',
      ...Array(18).fill('0 4px 12px rgba(0,0,0,0.15)'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { boxSizing: 'border-box' },
          body: {
            backgroundColor: '#ffffff',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#c8ccd1', borderRadius: 4 },
          },
          'a': { color: '#36c', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            padding: '7px 16px',
            fontSize: '0.875rem',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          outlined: {
            borderWidth: 1,
            borderColor: '#a2a9b1',
            color: '#202122',
            backgroundColor: '#f8f9fa',
            '&:hover': { backgroundColor: '#eaecf0', borderColor: '#72777d', borderWidth: 1 },
          },
          text: {
            color: '#36c',
            '&:hover': { backgroundColor: 'rgba(51,102,204,0.04)' },
          },
          sizeSmall: { padding: '4px 12px', fontSize: '0.8125rem' },
          sizeLarge: { padding: '10px 24px' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            border: '1px solid #a2a9b1',
            boxShadow: 'none',
            transition: 'none',
            '&:hover': { boxShadow: 'none', transform: 'none' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 2, backgroundImage: 'none' },
          elevation1: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #eaecf0' },
          elevation2: { boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: '1px solid #eaecf0' },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#ffffff',
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#36c' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: '#36c' },
            },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a2a9b1' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 2, fontSize: '0.75rem', height: 24 },
          filled: {
            '&.MuiChip-colorSuccess': { backgroundColor: '#d5fdf4', color: '#14866d' },
            '&.MuiChip-colorWarning': { backgroundColor: '#fef6e7', color: '#ac6600' },
            '&.MuiChip-colorError': { backgroundColor: '#fee7e6', color: '#d33' },
            '&.MuiChip-colorInfo': { backgroundColor: '#eaf3ff', color: '#36c' },
            '&.MuiChip-colorPrimary': { backgroundColor: '#eaf3ff', color: '#2a4b8d' },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: '#eaecf0',
              color: '#202122',
              fontWeight: 700,
              fontSize: '0.8125rem',
              borderBottom: '2px solid #a2a9b1',
              padding: '8px 12px',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
            '&:hover': { backgroundColor: '#eaf3ff' },
            '&:last-of-type td': { borderBottom: 0 },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#eaecf0',
            padding: '8px 12px',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 400,
            fontSize: '0.875rem',
            minHeight: 40,
            color: '#36c',
            borderRadius: 0,
            '&.Mui-selected': { fontWeight: 700, color: '#202122' },
          },
        },
      },
      MuiTabs: {
        defaultProps: { variant: 'scrollable', scrollButtons: 'auto', allowScrollButtonsMobile: true },
        styleOverrides: {
          root: { borderBottom: '1px solid #a2a9b1' },
          indicator: { height: 3, backgroundColor: '#36c' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 2,
            border: '1px solid #a2a9b1',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.1rem',
            fontWeight: 700,
            padding: '16px 20px 8px',
            borderBottom: '1px solid #eaecf0',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: '16px 20px' } },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: '8px 20px 16px', borderTop: '1px solid #eaecf0' },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.875rem', borderRadius: 2 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 2, '&:hover': { backgroundColor: '#eaf3ff' } },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 2, height: 6 },
          bar: { borderRadius: 2 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 2, fontSize: '0.75rem', fontWeight: 400, padding: '6px 10px', backgroundColor: '#202122' },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: { overflowX: 'auto', border: '1px solid #a2a9b1', borderRadius: 2 },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 2, border: '1px solid' } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            padding: '6px 12px',
            '&.Mui-selected': {
              backgroundColor: '#eaf3ff',
              borderLeft: '3px solid #36c',
              color: '#202122',
              '& .MuiListItemIcon-root': { color: '#36c' },
              '&:hover': { backgroundColor: '#d5e3f7' },
            },
            '&:hover': { backgroundColor: '#f8f9fa' },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: '1px solid #a2a9b1',
            backgroundColor: '#f8f9fa',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#202122',
            borderBottom: '1px solid #a2a9b1',
            boxShadow: 'none',
          },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: '#eaecf0' } },
      },
      MuiSelect: {
        styleOverrides: {
          root: { borderRadius: 2 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { borderRadius: 2, border: '1px solid #a2a9b1', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { fontSize: '0.875rem', '&:hover': { backgroundColor: '#eaf3ff' }, '&.Mui-selected': { backgroundColor: '#d5e3f7' } },
        },
      },
      MuiBreadcrumbs: {
        styleOverrides: {
          root: { fontSize: '0.8125rem' },
          separator: { color: '#72777d' },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: { borderRadius: '0 !important', border: '1px solid #a2a9b1', boxShadow: 'none', '&:before': { display: 'none' } },
        },
      },
    },
  });
};

// Default Wikipedia-style blue color
export const theme = createBubbleTheme({
  name: 'Wiki Blue', primary: '#36c', secondary: '#54595d', light: '#447ff5', dark: '#2a4b8d',
});
