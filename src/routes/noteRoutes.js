const router = require('express').Router();
const c = require('../controllers/noteController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate); // every notes route needs a valid JWT

router.route('/').post(c.createNote).get(c.getNotes);
router.route('/:id').get(c.getNote).put(c.updateNote).delete(c.deleteNote);

module.exports = router;
