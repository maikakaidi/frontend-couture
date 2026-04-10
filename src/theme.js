// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0D47A1", // bleu foncé
    },
    secondary: {
      main: "#E65100", // orange foncé
    },
    background: {
      default: "#F5F5F5", // gris clair
    },
    text: {
      primary: "#333333",
      secondary: "#0D47A1",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: {
      fontWeight: 700,
      color: "#0D47A1",
    },
    h6: {
      fontWeight: 600,
      color: "#E65100",
    },
  },
});

export default theme;
