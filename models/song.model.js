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

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

SongSchema.set("toJSON", {
  transform: (_, ret) => {
    if (ret.deleted) return ret;
    delete ret.deleted;
    return ret;
  },
});

module.exports = SongSchema;
