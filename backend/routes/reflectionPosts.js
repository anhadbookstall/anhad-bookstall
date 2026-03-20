// routes/reflectionPosts.js
const express = require('express');
const router = express.Router();
const {
  getPosts, createPost, reactToPost, addComment, deleteComment, deletePost,
} = require('../controllers/reflectionPostController');
const { protect, authenticated } = require('../middleware/auth');
const { uploadReflectionMedia } = require('../config/cloudinary');

router.get('/', protect, authenticated, getPosts);
router.post('/', protect, authenticated, uploadReflectionMedia.single('media'), createPost);
router.post('/:id/react', protect, authenticated, reactToPost);
router.post('/:id/comments', protect, authenticated, addComment);
router.delete('/:id/comments/:commentId', protect, authenticated, deleteComment);
router.delete('/:id', protect, authenticated, deletePost);

module.exports = router;