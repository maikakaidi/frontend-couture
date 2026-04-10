import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";

function NotificationsPage() {
  const notifications = [
    { id: 1, message: "Nouvelle commande reçue" },
    { id: 2, message: "Paiement confirmé" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Notifications</Typography>
      <List>
        {notifications.map((n) => (
          <ListItem key={n.id}>
            <ListItemText primary={n.message} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default NotificationsPage;
