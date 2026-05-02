// controllers/reflectionPostController.js
const ReflectionPost = require('../models/ReflectionPost');

// GET /api/reflection-posts - All posts newest first
const getPosts = async (req, res) => {
  const posts = await ReflectionPost.find()
    .populate('volunteer', 'name profilePhoto')
    .populate('comments.volunteer', 'name profilePhoto')
    .populate('reactions.volunteer', 'name')
    .sort('-createdAt');
  res.json(posts);
};

// POST /api/reflection-posts - Create a new post
const createPost = async (req, res) => {
  const { text } = req.body;
  console.log('createPost called');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);
  console.log('req.files:', req.files);

  if (!text?.trim() && !req.files?.length && !req.file) {
    return res.status(400).json({ message: 'Post must have text or an attachment' });
  }

  // Single file (video) - legacy
  let media;
  if (req.file) {
    const isVideo = req.file.mimetype?.startsWith('video/');
    media = {
      url: req.file.path,
      publicId: req.file.filename,
      type: isVideo ? 'video' : 'image',
    };
  }

  // Multiple images
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
  }

  console.log('images array:', JSON.stringify(images));

  const post = await ReflectionPost.create({
    volunteer: req.user.id,
    text: text?.trim(),
    media,
    images,
    bookstallContext: req.body.bookstallId ? {
      bookstallId: req.body.bookstallId,
      city: req.body.bookstallCity,
      location: req.body.bookstallLocation,
    } : undefined,
  });

  await post.populate('volunteer', 'name profilePhoto');
  await post.populate('comments.volunteer', 'name profilePhoto');
  await post.populate('reactions.volunteer', 'name');
  res.status(201).json(post);
};

// POST /api/reflection-posts/:id/react - Toggle a reaction
const reactToPost = async (req, res) => {
  const { emoji } = req.body;
  const validEmojis = ['👍', '👎', '❤️', '🙏', '💡', '😡', '😕', '🪔'];
  if (!validEmojis.includes(emoji)) {
    return res.status(400).json({ message: 'Invalid emoji' });
  }

  const post = await ReflectionPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const existingIdx = post.reactions.findIndex(
    (r) => r.volunteer.toString() === req.user.id
  );

  if (existingIdx !== -1) {
    if (post.reactions[existingIdx].emoji === emoji) {
      // Same emoji clicked again - remove reaction (toggle off)
      post.reactions.splice(existingIdx, 1);
    } else {
      // Different emoji - update to new one
      post.reactions[existingIdx].emoji = emoji;
    }
  } else {
    // New reaction
    post.reactions.push({ volunteer: req.user.id, emoji });
  }

  await post.save();
  await post.populate('volunteer', 'name profilePhoto');
  await post.populate('comments.volunteer', 'name profilePhoto');
  await post.populate('reactions.volunteer', 'name');
  res.json(post);
};

// POST /api/reflection-posts/:id/comments - Add a comment
const addComment = async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

  const post = await ReflectionPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  post.comments.push({ volunteer: req.user.id, text: text.trim() });
  await post.save();
  await post.populate('volunteer', 'name profilePhoto');
  await post.populate('comments.volunteer', 'name profilePhoto');
  await post.populate('reactions.volunteer', 'name');
  res.json(post);
};

// DELETE /api/reflection-posts/:id/comments/:commentId - Delete own comment
const deleteComment = async (req, res) => {
  const post = await ReflectionPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  if (comment.volunteer.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Cannot delete another volunteer\'s comment' });
  }

  comment.deleteOne();
  await post.save();
  res.json({ message: 'Comment deleted' });
};

// DELETE /api/reflection-posts/:id - Delete own post
const deletePost = async (req, res) => {
  const post = await ReflectionPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.volunteer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Cannot delete another volunteer\'s post' });
  }
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
};

// PUT /api/reflection-posts/:id - Edit own post text
const editPost = async (req, res) => {
  const { text } = req.body;
  const post = await ReflectionPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.volunteer.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Cannot edit another volunteer\'s post' });
  }
  post.text = text?.trim() || post.text;
  await post.save();
  await post.populate('volunteer', 'name profilePhoto');
  await post.populate('comments.volunteer', 'name profilePhoto');
  await post.populate('reactions.volunteer', 'name');
  res.json(post);
};

// GET /api/reflection-posts/:id/reactions - Get list of who reacted
const getReactions = async (req, res) => {
  const post = await ReflectionPost.findById(req.params.id)
    .populate('reactions.volunteer', 'name profilePhoto');
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post.reactions);
};

module.exports = { getPosts, createPost, reactToPost, addComment, deleteComment, deletePost, editPost, getReactions };