const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: "*" // allow all (safe for now, restrict later if needed)
}));
app.use(express.json());

// 📦 Database setup
const db = new sqlite3.Database("./locations.db");

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    description TEXT,
    lat REAL,
    lng REAL
  )
`);

// =====================
// 📍 ROUTES
// =====================

// GET all locations
app.get("/locations", (req, res) => {
  db.all("SELECT * FROM locations", [], (err, rows) => {
    if (err) {
      console.error("GET error:", err);
      return res.status(500).json({ error: "Failed to fetch locations" });
    }
    res.json(rows);
  });
});

// ADD location
app.post("/locations", (req, res) => {
  const { name, category, description, lat, lng } = req.body;

  if (!name || !lat || !lng) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    "INSERT INTO locations (name, category, description, lat, lng) VALUES (?, ?, ?, ?, ?)",
    [name, category, description, lat, lng],
    function (err) {
      if (err) {
        console.error("POST error:", err);
        return res.status(500).json({ error: "Failed to add location" });
      }

      res.json({
        id: this.lastID,
        name,
        category,
        description,
        lat,
        lng
      });
    }
  );
});

// UPDATE location
app.put("/locations/:id", (req, res) => {
  const { name, category, description, lat, lng } = req.body;
  const { id } = req.params;

  db.run(
    "UPDATE locations SET name=?, category=?, description=?, lat=?, lng=? WHERE id=?",
    [name, category, description, lat, lng, id],
    function (err) {
      if (err) {
        console.error("PUT error:", err);
        return res.status(500).json({ error: "Failed to update location" });
      }

      res.json({ updated: this.changes });
    }
  );
});

// DELETE location
app.delete("/locations/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM locations WHERE id=?", id, function (err) {
    if (err) {
      console.error("DELETE error:", err);
      return res.status(500).json({ error: "Failed to delete location" });
    }

    res.json({ deleted: this.changes });
  });
});

// =====================
// 🚀 START SERVER
// =====================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});