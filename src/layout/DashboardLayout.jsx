import { useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";

const drawerWidth = 240;

function DashboardLayout({ children, toggleMode, mode }) {
  const navigate = useNavigate();

  const menuItems = [
    { text: "Dashboard", path: "/dashboard" },
    { text: "Clients", path: "/clients" },
    { text: "Inventory", path: "/inventory" },
    { text: "Orders", path: "/orders" },       // ✅ ajouté
    { text: "Measures", path: "/measures" },   // ✅ ajouté
    { text: "Products", path: "/products" },   // ✅ ajouté
    { text: "Subscriptions", path: "/subscriptions" },
    { text: "Payments", path: "/payments" },
    { text: "Notifications", path: "/notifications" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ bgcolor: "#0D47A1", zIndex: 1201 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Couture App
          </Typography>
          <IconButton color="inherit" onClick={toggleMode}>
            <Brightness4Icon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            bgcolor: "#E65100", // orange foncé
            color: "white",
          },
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default DashboardLayout;
