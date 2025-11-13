const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const Playlist = require("./models/playlist.model");

const app = express();

PORT = process.env.PORT || 3000;

require("dotenv").config();
app.use(express.json());
app.use(cors());
app.use(helmet());

app.get("/", (req, res) => {
  console.log("Welcome to Music Playlist API!");
});

app.get("/api/v1/playlists", async (req, res) => {
  try {
    const playlists = await Playlist.find().sort({ createdAt: -1 });
    if (!playlists)
      return res.status(404).json({ message: "Could not load playlists." });

    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/v1/playlists/:playlistId", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.playlistId);
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found." });

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/v1/playlists/name/:playlistName", async (req, res) => {
  try {
    const playlist = await Playlist.find({
      name: { $regex: req.params.playlistName, $options: "i" },
    });
    if (!playlist)
      return res.status(404).json({ message: "Playlist not found." });

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/v1/playlists", async (req, res) => {
  try {
    const playlist = new Playlist(req.body);
    await playlist.save();
    res.status(201).json(playlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () =>
      console.log(`Music Playlist API is running on port ${PORT}`),
    );
  } catch (err) {
    console.error("Failed to connect:", err.message);
  }
}

startServer();
