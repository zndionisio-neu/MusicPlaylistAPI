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

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

PlaylistSchema.set("toJSON", {
  transform: (_, ret) => {
    if (ret.songs) ret.songs = ret.songs.filter((song) => !song.deleted);
    delete ret.deleted;
    return ret;
  },
});
const Playlist = mongoose.model("Playlist", PlaylistSchema);

module.exports = Playlist;
