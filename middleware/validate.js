function validatePlaylist(req, res, next) {
  const { name, description, songs, author } = req.body || {};

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Playlist 'name' is required and must be a string." });
  }

  if (description && typeof description !== "string") {
    return res.status(400).json({ error: "Playlist 'description' must be a string." });
  }

  if (author && typeof author !== "string") {
    return res.status(400).json({ error: "Playlist 'author' must be a string." });
  }

  if (songs !== undefined && !Array.isArray(songs)) {
    return res.status(400).json({ error: "'songs' must be an array." });
  }

// Kapag may songs, mag-check ng basic validation sa bawat item
  if (Array.isArray(songs)) {
    for (let i = 0; i < songs.length; i++) {
      const s = songs[i] || {};
      if (!s.title || typeof s.title !== "string") return res.status(400).json({ error: `Song at index ${i} must have a string 'title'.` });
      if (!s.artist || typeof s.artist !== "string") return res.status(400).json({ error: `Song at index ${i} must have a string 'artist'.` });
    }
  }

  return next();
}

function validateSong(req, res, next) {
  const { title, artist } = req.body || {};

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Song 'title' is required and must be a string." });
  }

  if (!artist || typeof artist !== "string") {
    return res.status(400).json({ error: "Song 'artist' is required and must be a string." });
  }

  return next();
}

module.exports = { validatePlaylist, validateSong };
