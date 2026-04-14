import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

// Servir les fichiers statiques du build React
app.use(express.static(path.join(__dirname, "build")));

// Routes admin : toujours renvoyer index.html
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Routes générales : toujours renvoyer index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
