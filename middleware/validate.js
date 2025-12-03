class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

function validatePlaylist(req, res, next) {
  try {
    const { name, description, songs, author } = req.body || {};

    if (!name || typeof name !== 'string') {
      throw new ValidationError("Playlist 'name' is required and must be a string.");
    }

    // Enforce minimum name length (business rule): at least 6 characters
    if (typeof name === 'string' && name.trim().length < 6) {
      throw new ValidationError("Playlist 'name' must be at least 6 characters.");
    }

    if (description && typeof description !== 'string') {
      throw new ValidationError("Playlist 'description' must be a string.");
    }

    if (author && typeof author !== 'string') {
      throw new ValidationError("Playlist 'author' must be a string.");
    }

    if (songs !== undefined && !Array.isArray(songs)) {
      throw new ValidationError("'songs' must be an array.");
    }

    // If songs provided, validate each item
    if (Array.isArray(songs)) {
      for (let i = 0; i < songs.length; i++) {
        const s = songs[i] || {};
        if (!s.title || typeof s.title !== 'string') throw new ValidationError(`Song at index ${i} must have a string 'title'.`);
        if (!s.artist || typeof s.artist !== 'string') throw new ValidationError(`Song at index ${i} must have a string 'artist'.`);
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

function validateSong(req, res, next) {
  try {
    const { title, artist } = req.body || {};

    if (!title || typeof title !== 'string') {
      throw new ValidationError("Song 'title' is required and must be a string.");
    }

    if (!artist || typeof artist !== 'string') {
      throw new ValidationError("Song 'artist' is required and must be a string.");
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { validatePlaylist, validateSong, ValidationError };
