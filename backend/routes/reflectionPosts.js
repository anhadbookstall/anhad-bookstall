// routes/reflectionPosts.js
const express = require('express');
const router = express.Router();
const {
  getPosts, createPost, reactToPost, addComment, deleteComment, deletePost, editPost, getReactions,
} = require('../controllers/reflectionPostController');
const { protect, authenticated } = require('../middleware/auth');
const { uploadReflectionMedia } = require('../config/cloudinary');

router.get('/', protect, authenticated, getPosts);
router.post('/', protect, authenticated, uploadReflectionMedia.array('media', 10), createPost);
router.post('/:id/react', protect, authenticated, reactToPost);
router.post('/:id/comments', protect, authenticated, addComment);
router.delete('/:id/comments/:commentId', protect, authenticated, deleteComment);
router.delete('/:id', protect, authenticated, deletePost);
router.put('/:id', protect, authenticated, editPost);
router.get('/:id/reactions', protect, authenticated, getReactions);

module.exports = router;