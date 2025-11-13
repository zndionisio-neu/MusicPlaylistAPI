const mongoose = require("mongoose");

const SongSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    artist: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  },
);
