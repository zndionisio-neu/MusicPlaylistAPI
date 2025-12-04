const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const Playlist = require("./models/playlist.model");

const app = express();

const PORT = process.env.PORT || 3000;
const BASE_ENDPOINT = "/api/v1";

require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

const validateObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);
const sanitizeString = (str) => (typeof str === "string" ? str.trim() : str);

const sanitizeRequestData = (req, res, next) => {
  try {
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== "object") return;

      Object.keys(obj).forEach((key) => {
        obj[key] = sanitizeString(obj[key]);
      });
    };

    sanitizeObject(req.body);
    sanitizeObject(req.query);
    sanitizeObject(req.params);

    next();
  } catch (err) {
    next(err);
  }
};

app.use(sanitizeRequestData);

// --- Route validation middlewares ---
const validatePlaylistMiddleware = (req, res, next) => {
  try {
    const { playlistId } = req.params;
    if (playlistId && !validateObjectId(playlistId)) {
      return next({ status: 400, message: "Invalid playlist ID" });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

app.get(`${BASE_ENDPOINT}/`, (_, res) => {
  console.log("Welcome to Music Playlist API!");
  res.status(200).json({ message: "Welcome to Music Playlist API!" });
});

// GET all playlists
app.get(`${BASE_ENDPOINT}/playlists`, async (_, res) => {
  try {
    const playlists = await Playlist.find({ deleted: false }).select({
      songs: 0,
    });

    if (playlists.length === 0)
      return res.status(404).json({ message: "Could not load playlists." });

    res.status(200).json(playlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a playlist by ID
app.get(
  `${BASE_ENDPOINT}/playlists/:playlistId`,
  validatePlaylistMiddleware,
  async (req, res) => {
    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });
      if (!playlist || playlist.deleted)
        return res.status(404).json({ message: "Playlist not found." });

      res.status(200).json(playlist);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// GET a playlist by Name
app.get(`${BASE_ENDPOINT}/playlists/name/:playlistName`, async (req, res) => {
  try {
    const playlist = await Playlist.find({
      name: { $regex: req.params.playlistName.trim(), $options: "i" },
      deleted: false,
    }).select({ songs: 0 });

    if (playlist.length === 0)
      return res.status(404).json({ message: "Playlist not found." });

    res.status(200).json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all songs from a playlist by playlistId
app.get(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs`,
  validatePlaylistMiddleware,
  async (req, res) => {
    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });
      if (!playlist || playlist.deleted)
        return res.status(404).json({ message: "Playlist not found." });

      const songs = playlist.songs.filter((song) => !song.deleted);
      if (songs.length === 0)
        return res.status(404).json({ message: "Songs not found." });

      res.status(200).json(songs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// GET a song by songId
app.get(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs/:songId`,
  validatePlaylistMiddleware,
  async (req, res) => {
    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });
      if (!playlist || playlist.deleted)
        return res.status(404).json({ message: "Playlist not found." });

      const song = playlist.songs.id(req.params.songId);
      if (!song || song.deleted === true)
        return res.status(404).json({ message: "Song not found." });

      res.status(200).json(song);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// GET Songs by Name
app.get(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs/title/:songName`,
  async (req, res) => {
    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });

      if (!playlist || playlist.deleted)
        return res.status(404).json({ message: "Playlist not found." });

      const song = playlist.songs.filter(
        (song) =>
          song.title
            .toLowerCase()
            .includes(req.params.songName.trim().toLowerCase()) &&
          !song.deleted,
      );

      if (song.length === 0)
        return res.status(404).json({ message: "Song not found." });

      res.status(200).json(song);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// POST a playlist
app.post(`${BASE_ENDPOINT}/playlists`, async (req, res) => {
  try {
    const playlist = new Playlist(req.body);
    await playlist.save();
    res.status(201).json({
      message: "Playlist has been created.",
      document: playlist,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a song in a playlist
app.post(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs`,
  validatePlaylistMiddleware,
  async (req, res) => {
    const song = req.body;
    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });

      if (!playlist || playlist.deleted)
        return res.status(404).json({ message: "Playlist is not found." });

      playlist.songs.push(song);
      await playlist.save();

      res.status(201).json({
        message: "Song has been added.",
        document: song,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// UPDATE a playlist's information
app.patch(
  `${BASE_ENDPOINT}/playlists/:playlistId`,
  validatePlaylistMiddleware,
  async (req, res) => {
    if (req.body.hasOwnProperty("deleted")) delete req.body.deleted;

    try {
      const playlist = await Playlist.findOneAndUpdate(
        {
          _id: req.params.playlistId,
          deleted: false,
        },
        req.body,
        { new: true },
      );

      if (!playlist || playlist.deleted)
        return res.status(404).json({ message: "Playlist not found." });

      return res.status(200).json({
        message: "Playlist has been updated",
        document: playlist,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// UPDATE a song's information
app.patch(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs/:songId`,
  validatePlaylistMiddleware,
  async (req, res) => {
    if (req.body.hasOwnProperty("deleted")) delete req.body.deleted;

    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });

      if (!playlist || playlist.deleted)
        return res.status(404).json({ message: "Playlist not found." });

      const song = playlist.songs.id(req.params.songId);
      if (!song || song.deleted === true)
        return res.status(404).json({ message: "Song not found." });

      Object.assign(song, req.body);
      await playlist.save();

      return res.status(200).json({
        message: "Song has been updated",
        document: song,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// DELETE a playlist
app.delete(
  `${BASE_ENDPOINT}/playlists/:playlistId`,
  validatePlaylistMiddleware,
  async (req, res) => {
    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });

      if (!playlist)
        return res.status(404).json({ message: "Playlist not found." });

      playlist.deleted = true;
      await playlist.save();

      res.status(200).json({
        message: "Playlist has been deleted",
        document: playlist,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// DELETE a song by songId
app.delete(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs/:songId`,
  validatePlaylistMiddleware,
  async (req, res) => {
    try {
      const playlist = await Playlist.findOne({
        _id: req.params.playlistId,
        deleted: false,
      });
      if (!playlist)
        return res.status(404).json({ message: "Playlist not found." });

      const song = playlist.songs.id(req.params.songId);
      if (!song || song.deleted === true)
        return res.status(404).json({ message: "Song not found." });

      song.deleted = true;
      await playlist.save();

      res.status(200).json({
        message: "Song has been removed.",
        document: song,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err && err.stack ? err.stack : err);

  // If the error has a status (our ValidationError), use it
  if (err && err.status && typeof err.status === "number") {
    return res
      .status(err.status)
      .json({ error: err.message || "Validation error" });
  }

  // Mongoose validation error
  if (err && err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Server error" });
});

async function startServer() {
  try {
    // Allow skipping MongoDB connection for local smoke tests by setting SKIP_DB=true
    if (process.env.SKIP_DB === "true") {
      console.log(
        "SKIP_DB=true — skipping MongoDB connection and starting server without DB",
      );
      app.listen(PORT, () =>
        console.log(`Music Playlist API is running on port ${PORT} (no DB)`),
      );
      return;
    }

    if (!MONGODB_URI) {
      console.error("Failed to connect: MONGODB_URI or MONGO_URI is not set.");
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`Music Playlist API is running on port ${PORT}`),
    );
  } catch (err) {
    console.error("Failed to connect:", err.message);
  }
}

startServer();
