import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

// Servir les fichiers statiques du dossier build (React)
app.use(express.static(path.join(__dirname, "build")));

// Route principale : toutes les routes renvoient index.html (important pour React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
