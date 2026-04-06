import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { createBubbleTheme } from './theme';
import useThemeStore from './store/themeStore';

function ThemeWrapper({ children }) {
  const selectedColor = useThemeStore((s) => s.selectedColor);
  const theme = React.useMemo(() => createBubbleTheme(selectedColor), [selectedColor]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeWrapper>
        <App />
        <Toaster position="top-right" />
      </ThemeWrapper>
    </BrowserRouter>
  </React.StrictMode>
);
