// src/pages/volunteer/ReflectionsFeed.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, CircularProgress,
  Alert, TextField, InputAdornment, Button, IconButton, Chip,
  Collapse, Divider, Tooltip, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, List, ListItem,
  ListItemAvatar, ListItemText,
} from '@mui/material';
import {
  Search, AutoStories, Send, Image, VideoFile,
  MoreVert, Delete, Close, AddPhotoAlternate, Edit,
} from '@mui/icons-material';
import {
  getReflectionPosts, createReflectionPost, reactToPost,
  addComment, deleteComment, deleteReflectionPost, getAllReflections,
  editReflectionPost, getPostReactions,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const REACTIONS = ['👍', '👎', '❤️', '🙏', '💡', '😡', '😕', '🪔'];

// ---- Single Post Card ----
const PostCard = ({ post, currentUserId, onUpdate, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [editLoading, setEditLoading] = useState(false);
  const [reactionsDialogOpen, setReactionsDialogOpen] = useState(false);
  const [reactionsList, setReactionsList] = useState([]);
  const [reactionsLoading, setReactionsLoading] = useState(false);

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setEditLoading(true);
    try {
      const res = await editReflectionPost(post._id, { text: editText });
      onUpdate(res.data);
      setEditing(false);
      toast.success('Post updated');
    } catch {
      toast.error('Error updating post');
    } finally {
      setEditLoading(false);
    }
  };

  const handleShowReactions = async () => {
    setReactionsDialogOpen(true);
    setReactionsLoading(true);
    try {
      const res = await getPostReactions(post._id);
      setReactionsList(res.data);
    } catch {
      toast.error('Error loading reactions');
    } finally {
      setReactionsLoading(false);
    }
  };

  const myReaction = post.reactions?.find((r) => r.volunteer?._id === currentUserId || r.volunteer === currentUserId);

  // Group reactions by emoji
  const reactionCounts = {};
  post.reactions?.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  const handleReact = async (emoji) => {
    try {
      const res = await reactToPost(post._id, emoji);
      onUpdate(res.data);
    } catch {
      toast.error('Error reacting');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await addComment(post._id, commentText);
      onUpdate(res.data);
      setCommentText('');
    } catch {
      toast.error('Error posting comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(post._id, commentId);
      onUpdate({ ...post, comments: post.comments.filter((c) => c._id !== commentId) });
    } catch {
      toast.error('Error deleting comment');
    }
  };

  const isMyPost =
  !post.isLegacy &&
  (post.volunteer?._id === currentUserId ||
   post.volunteer === currentUserId);

  return (
    <Card sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent>
        {/* Post Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={post.volunteer?.profilePhoto?.url} sx={{ width: 44, height: 44 }}>
              {post.volunteer?.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>{post.volunteer?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(post.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Typography>
            </Box>
          </Box>

          {isMyPost && (
            <>
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVert fontSize="small" />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => { setEditing(true); setEditText(post.text || ''); setMenuAnchor(null); }}>
                  <Edit fontSize="small" sx={{ mr: 1 }} /> Edit Post
                </MenuItem>
                <MenuItem onClick={() => { onDelete(post._id); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
                  <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Post
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        {/* Post Text / Edit Mode */}
        {editing ? (
          <Box sx={{ mb: 1.5 }}>
            <TextField
              fullWidth multiline minRows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleEdit} disabled={editLoading}>
                {editLoading ? <CircularProgress size={16} color="inherit" /> : 'Save'}
              </Button>
              <Button size="small" variant="outlined" onClick={() => setEditing(false)}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          post.text && (
            <Typography variant="body1" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {post.text}
            </Typography>
          )
        )}

        {/* Single Media (video or legacy single image) */}
        {post.media?.url && (
          <Box sx={{ mb: 1.5, borderRadius: 1, overflow: 'hidden', maxHeight: 400 }}>
            {post.media.type === 'video' ? (
              <video src={post.media.url} controls style={{ width: '100%', maxHeight: 400, borderRadius: 8 }} />
            ) : (
              <img src={post.media.url} alt="attachment" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }} />
            )}
          </Box>
        )}

        {/* Multiple Images Grid */}
        {post.images?.length > 0 && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: post.images.length === 1 ? '1fr' : post.images.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: 0.5, mb: 1.5, borderRadius: 2, overflow: 'hidden',
          }}>
            {post.images.map((img, i) => (
              <Box key={i} component="a" href={img.url} target="_blank"
                sx={{ display: 'block', aspectRatio: '1', overflow: 'hidden' }}>
                <img src={img.url} alt={`attachment ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
              </Box>
            ))}
          </Box>
        )}

        {/* Bookstall context badge - shown for both legacy and new bookstall reflections */}
        {post.isLegacy && (
          <Chip
            size="small"
            label={`📍 ${post.bookstall?.city?.name} — ${post.bookstall?.location}`}
            variant="outlined"
            color="primary"
            sx={{ mb: 1, mr: 1 }}
          />
        )}
        {!post.isLegacy && post.bookstallContext?.city && (
          <Chip
            size="small"
            label={`📍 ${post.bookstallContext.city} — ${post.bookstallContext.location}`}
            variant="outlined"
            color="primary"
            sx={{ mb: 1, mr: 1 }}
          />
        )}

        <Divider sx={{ my: 1 }} />

        {/* Reaction counts — click to see who reacted */}
        {!post.isLegacy && Object.keys(reactionCounts).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <Chip
                key={emoji}
                label={`${emoji} ${count}`}
                size="small"
                variant={myReaction?.emoji === emoji ? 'filled' : 'outlined'}
                color={myReaction?.emoji === emoji ? 'primary' : 'default'}
                onClick={handleShowReactions}
                sx={{ cursor: 'pointer', fontSize: '0.85rem' }}
              />
            ))}
          </Box>
        )}

        {/* Reactions List Dialog */}
        <Dialog open={reactionsDialogOpen} onClose={() => setReactionsDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Reactions</DialogTitle>
          <DialogContent>
            {reactionsLoading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
            <List dense>
              {reactionsList.map((r) => (
                <ListItem key={r._id}>
                  <ListItemAvatar>
                    <Avatar src={r.volunteer?.profilePhoto?.url} sx={{ width: 32, height: 32 }}>
                      {r.volunteer?.name?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={r.volunteer?.name} />
                  <Typography fontSize="1.2rem">{r.emoji}</Typography>
                </ListItem>
              ))}
              {!reactionsLoading && reactionsList.length === 0 && (
                <ListItem><ListItemText primary="No reactions yet" /></ListItem>
              )}
            </List>
          </DialogContent>
        </Dialog>

        {/* Reaction buttons + comments toggle */}
        {!post.isLegacy && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {(showAllReactions ? REACTIONS : REACTIONS.slice(0, 5)).map((emoji) => (
                <Tooltip key={emoji} title={myReaction?.emoji === emoji ? 'Remove reaction' : 'React'}>
                  <IconButton
                    size="small"
                    onClick={() => handleReact(emoji)}
                    sx={{
                      fontSize: '1.2rem',
                      border: myReaction?.emoji === emoji ? '2px solid' : '1px solid transparent',
                      borderColor: myReaction?.emoji === emoji ? 'primary.main' : 'transparent',
                      borderRadius: 2,
                      p: 0.5,
                    }}
                  >
                    {emoji}
                  </IconButton>
                </Tooltip>
              ))}
              <Button size="small" onClick={() => setShowAllReactions(!showAllReactions)} sx={{ minWidth: 'auto', fontSize: '0.7rem' }}>
                {showAllReactions ? 'Less' : 'More'}
              </Button>
              <Button size="small" sx={{ ml: 'auto' }} onClick={() => setShowComments(!showComments)}>
                💬 {post.comments?.length || 0} Comment{post.comments?.length !== 1 ? 's' : ''}
              </Button>
            </Box>

            <Collapse in={showComments}>
              <Divider sx={{ mb: 1 }} />
              {post.comments?.map((c) => {
                const isMyComment = c.volunteer?._id === currentUserId || c.volunteer === currentUserId;
                return (
                  <Box key={c._id} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                    <Avatar src={c.volunteer?.profilePhoto?.url} sx={{ width: 30, height: 30, mt: 0.3 }}>
                      {c.volunteer?.name?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 0.8 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight={700}>{c.volunteer?.name}</Typography>
                        {isMyComment && (
                          <IconButton size="small" onClick={() => handleDeleteComment(c._id)} sx={{ p: 0 }}>
                            <Close sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="body2">{c.text}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField
                  fullWidth size="small" placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                />
                <IconButton color="primary" onClick={handleComment} disabled={commentLoading || !commentText.trim()}>
                  {commentLoading ? <CircularProgress size={20} /> : <Send />}
                </IconButton>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ---- Create Post Box ----
const CreatePost = ({ currentUser, onPostCreated }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]); // multiple images
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setImages((prev) => [...prev, ...files].slice(0, 10)); // max 10
    const previews = files.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setImagePreviews((prev) => [...prev, ...previews].slice(0, 10));
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handlePost = async () => {
    console.log("POST CLICKED");
    if (!text.trim() && images.length === 0) return toast.error('Write something or attach photos');
    setLoading(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('text', text.trim());
      images.forEach((img) => fd.append('media', img));
      const res = await createReflectionPost(fd);
      onPostCreated(res.data);
      setText('');
      setImages([]);
      setImagePreviews([]);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Posted! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error posting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Avatar src={currentUser?.profilePhoto?.url} sx={{ width: 44, height: 44 }}>
            {currentUser?.name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth multiline minRows={2} maxRows={6}
              placeholder="Share your thoughts, experiences, or reflections..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              variant="outlined"
              sx={{ mb: 1 }}
            />

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {imagePreviews.map((p, i) => (
                  <Box key={i} sx={{ position: 'relative', display: 'inline-block' }}>
                    <img src={p.url} alt="preview"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                    <IconButton size="small" onClick={() => removeImage(i)}
                      sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'error.main', color: 'white',
                        width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}>
                      <Close sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Attach Photos (up to 10)">
                  <IconButton component="label" size="small" color="primary">
                    <AddPhotoAlternate />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      multiple
                      onChange={handleMediaChange}
                    />
                  </IconButton>
                </Tooltip>
                {images.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {images.length} photo{images.length > 1 ? 's' : ''} selected
                  </Typography>
                )}
              </Box>
              <Button
                type="button"
                variant="contained"
                size="small"
                sx={{ zIndex: 10 }} // 👈 important
                onClick={(e) => {
                  e.stopPropagation();   // 👈 prevent parent blocking
                  console.log("CLICK WORKING");
                  handlePost();
                }}
              >
                Post
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ---- Main Feed ----
const ReflectionsFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      getReflectionPosts().catch(() => ({ data: [] })),
      getAllReflections().catch(() => ({ data: [] })),
    ]).then(([newPostsRes, oldReflectionsRes]) => {
      // Normalize old bookstall reflections to match new post format
      const oldPosts = oldReflectionsRes.data.map((r) => ({
        _id: r._id,
        volunteer: r.volunteer,
        text: r.text,
        createdAt: r.writtenAt,
        reactions: [],
        comments: [],
        isLegacy: true, // flag so we know it's read-only
        bookstall: r.bookstall,
      }));

      // Merge and sort by date newest first
      const merged = [...newPostsRes.data, ...oldPosts].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPosts(merged);
    }).finally(() => setLoading(false));
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDeleted = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteReflectionPost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Post deleted');
    } catch {
      toast.error('Error deleting post');
    }
  };

  const filtered = posts.filter((p) =>
    search.trim() === '' ||
    p.text?.toLowerCase().includes(search.toLowerCase()) ||
    p.volunteer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box maxWidth={680} mx="auto">
      {/* Search ABOVE header */}
      <TextField
        fullWidth placeholder="Search posts..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        size="small" sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
        }}
      />

      <Typography variant="h4" mb={1}>
        <AutoStories sx={{ mr: 1, verticalAlign: 'middle' }} />
        Reflections
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Share thoughts and experiences with the volunteer community
      </Typography>

      {/* Create Post */}
      <CreatePost currentUser={user} onPostCreated={handlePostCreated} />

      {filtered.length === 0 && (
        <Alert severity="info">
          {search ? 'No posts match your search.' : 'No reflections yet. Be the first to post!'}
        </Alert>
      )}

      {filtered.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={user?._id}
          onUpdate={handlePostUpdated}
          onDelete={handlePostDeleted}
        />
      ))}
    </Box>
  );
};

export default ReflectionsFeed;