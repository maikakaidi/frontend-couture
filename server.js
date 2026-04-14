import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

// Servir les fichiers du build React
app.use(express.static(path.join(__dirname, "build")));

// Route pour React Router (toutes les pages)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Frontend PWA running on http://localhost:${PORT}`);
});

