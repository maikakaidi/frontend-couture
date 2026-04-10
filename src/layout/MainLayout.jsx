// src/layout/MainLayout.jsx
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

function MainLayout({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6">Couture App</Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
}

export default MainLayout;
