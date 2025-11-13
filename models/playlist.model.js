const mongoose = require("mongoose");
const SongSchema = require("./song.model.js");

const PlaylistSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter playlist name"],
    },

    songs: {
      type: [SongSchema],
      required: false,
    },

    author: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Playlist = mongoose.model("Playlist", PlaylistSchema);

module.exports = Playlist;
