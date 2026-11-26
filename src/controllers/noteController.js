const Note = require('../models/Note');
const appEvents = require('../events/appEvents');

// Owner OR admin may touch a note
const canAccess = (note, user) => user.role === 'admin' || String(note.owner) === String(user._id);

// POST /api/notes
exports.createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required.' });

    const note = await Note.create({ title, content, owner: req.user._id });
    appEvents.emit('note:created', note);
    res.status(201).json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

// GET /api/notes   (own notes; admin sees everyone's)
exports.getNotes = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const notes = await Note.find(filter).sort('-createdAt');
    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    next(err);
  }
};

// GET /api/notes/:id
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    if (!canAccess(note, req.user)) return res.status(403).json({ success: false, message: 'Not your note.' });
    res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notes/:id
exports.updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    if (!canAccess(note, req.user)) return res.status(403).json({ success: false, message: 'Not your note.' });

    const { title, content } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    await note.save();

    appEvents.emit('note:updated', note);
    res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notes/:id
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    if (!canAccess(note, req.user)) return res.status(403).json({ success: false, message: 'Not your note.' });

    await note.deleteOne();
    appEvents.emit('note:deleted', note._id);
    res.json({ success: true, message: 'Note deleted.' });
  } catch (err) {
    next(err);
  }
};
