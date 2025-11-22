const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const Playlist = require("./models/playlist.model");

const app = express();

const PORT = process.env.PORT || 3000;
const BASE_ENDPOINT = "/api/v1";

require("dotenv").config();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Validation middleware applied via app.use()
// - POST /api/v1/playlists -> requires `name` and `author` (non-empty strings)
//   optional `songs` array items will be validated minimally if present
// - POST /api/v1/playlists/:playlistId/songs -> requires `title` and `artist` (non-empty strings)
app.use((req, res, next) => {
  try {
    // Only validate POST requests
    if (req.method !== "POST") return next();

    const isPlaylistCreate = req.path === `${BASE_ENDPOINT}/playlists`;

    // matches /api/v1/playlists/:playlistId/songs
    const songCreateRegex = new RegExp(`${BASE_ENDPOINT.replace(/\//g, "\\/")}\\/playlists\\/[^\\/]+\\/songs$`);
    const isSongCreate = songCreateRegex.test(req.path);

    if (!isPlaylistCreate && !isSongCreate) return next();

    // Helper inline validators (kept minimal)
    const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";

    if (isPlaylistCreate) {
      const { name, author, songs } = req.body || {};
      if (!isNonEmptyString(name)) {
        return res.status(400).json({ message: "Playlist 'name' is required and must be a non-empty string." });
      }
      if (!isNonEmptyString(author)) {
        return res.status(400).json({ message: "Playlist 'author' is required and must be a non-empty string." });
      }

      // If `songs` is provided, ensure it's an array and items have required fields
      if (songs !== undefined) {
        if (!Array.isArray(songs)) {
          return res.status(400).json({ message: "Playlist 'songs' must be an array if provided." });
        }
        for (let i = 0; i < songs.length; i++) {
          const s = songs[i] || {};
          if (!isNonEmptyString(s.title)) {
            return res.status(400).json({ message: `Song at index ${i} must have a non-empty 'title'.` });
          }
          if (!isNonEmptyString(s.artist)) {
            return res.status(400).json({ message: `Song at index ${i} must have a non-empty 'artist'.` });
          }
        }
      }
    }

    if (isSongCreate) {
      const { title, artist } = req.body || {};
      if (!isNonEmptyString(title)) {
        return res.status(400).json({ message: "Song 'title' is required and must be a non-empty string." });
      }
      if (!isNonEmptyString(artist)) {
        return res.status(400).json({ message: "Song 'artist' is required and must be a non-empty string." });
      }
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: "Validation middleware error." });
  }
});

app.get(`${BASE_ENDPOINT}/`, (_, res) => {
  console.log("Welcome to Music Playlist API!");
  res.status(200);
});

// GET all playlists
app.get(`${BASE_ENDPOINT}/playlists`, async (_, res) => {
  try {
    const playlists = await Playlist.find({ deleted: false }).select({
      songs: 0,
    });
    if (!playlists)
      return res.status(404).json({ message: "Could not load playlists." });

    res.status(200).json(playlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a playlist by ID
app.get(`${BASE_ENDPOINT}/playlists/:playlistId`, async (req, res) => {
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
});

// GET a playlist by Name
app.get(`${BASE_ENDPOINT}/playlists/name/:playlistName`, async (req, res) => {
  try {
    const playlist = await Playlist.find({
      name: { $regex: req.params.playlistName, $options: "i" },
      deleted: false,
    }).select({ songs: 0 });
    if (!playlist || playlist.deleted)
      return res.status(404).json({ message: "Playlist not found." });

    res.status(200).json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all songs from a playlist by playlistId
app.get(`${BASE_ENDPOINT}/playlists/:playlistId/songs`, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.playlistId,
      deleted: false,
    });
    if (!playlist || playlist.deleted)
      return res.status(404).json({ message: "Playlist not found." });

    const songs = playlist.songs.filter((song) => !song.deleted);
    if (!songs) return res.status(404).json({ message: "Songs not found." });

    res.status(200).json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a song by songId
app.get(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs/:songId`,
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
app.post(`${BASE_ENDPOINT}/playlists/:playlistId/songs`, async (req, res) => {
  const song = req.body;
  try {
    const playlist = await Playlist.findById(req.params.playlistId);

    if (!playlist || playlist.deleted)
      return res.status(404).json({ message: "Playlist is not found." });

    playlist.songs.push(song);
    playlist.save();

    res.status(201).json({
      message: "Song has been added.",
      document: song,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE a playlist's information
app.put(`${BASE_ENDPOINT}/playlists/:playlistId`, async (req, res) => {
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

    return res.status(201).json({
      message: "Playlist has been updated",
      document: playlist,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE a song's information
app.put(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs/:songId`,
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

      if (req.body.title) song.title = req.body.title;
      if (req.body.artist) song.artist = req.body.artist;

      // Object.assign(song, req.params.body);
      playlist.save();

      return res.status(201).json({
        message: "Song has been updated",
        document: song,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// DELETE a playlist
app.delete(`${BASE_ENDPOINT}/playlists/:playlistId`, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.playlistId,
      deleted: false,
    });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found." });

    playlist.deleted = true;
    playlist.save();

    res.status(200).json({
      message: "Playlist has been deleted",
      document: playlist,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a song by songId
app.delete(
  `${BASE_ENDPOINT}/playlists/:playlistId/songs/:songId`,
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
      playlist.save();

      res.status(200).json({
        message: "Song has been removed.",
        document: song,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

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
