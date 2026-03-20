// src/pages/volunteer/ReflectionsFeed.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, CircularProgress,
  Alert, TextField, InputAdornment, Button, IconButton, Chip,
  Collapse, Divider, Tooltip, Menu, MenuItem,
} from '@mui/material';
import {
  Search, AutoStories, Send, Image, VideoFile,
  MoreVert, Delete, Close, AddPhotoAlternate,
} from '@mui/icons-material';
import {
  getReflectionPosts, createReflectionPost, reactToPost,
  addComment, deleteComment, deleteReflectionPost, getAllReflections,
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

  const isMyPost = !post.isLegacy && (post.volunteer?._id === currentUserId || post.volunteer === currentUserId);

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
                <MenuItem onClick={() => { onDelete(post._id); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
                  <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Post
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        {/* Post Text */}
        {post.text && (
          <Typography variant="body1" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {post.text}
          </Typography>
        )}

        {/* Media Attachment */}
        {post.media?.url && (
          <Box sx={{ mb: 1.5, borderRadius: 1, overflow: 'hidden', maxHeight: 400 }}>
            {post.media.type === 'video' ? (
              <video
                src={post.media.url}
                controls
                style={{ width: '100%', maxHeight: 400, borderRadius: 8 }}
              />
            ) : (
              <img
                src={post.media.url}
                alt="attachment"
                style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
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

        {/* Reaction counts summary */}
        {!post.isLegacy && Object.keys(reactionCounts).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <Chip
                key={emoji}
                label={`${emoji} ${count}`}
                size="small"
                variant={myReaction?.emoji === emoji ? 'filled' : 'outlined'}
                color={myReaction?.emoji === emoji ? 'primary' : 'default'}
                onClick={() => handleReact(emoji)}
                sx={{ cursor: 'pointer', fontSize: '0.85rem' }}
              />
            ))}
          </Box>
        )}

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
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type: file.type.startsWith('video/') ? 'video' : 'image' });
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePost = async () => {
    if (!text.trim() && !media) return toast.error('Write something or attach a photo/video');
    setLoading(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('text', text.trim());
      if (media) fd.append('media', media);
      const res = await createReflectionPost(fd);
      onPostCreated(res.data);
      setText('');
      setMedia(null);
      setMediaPreview(null);
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

            {/* Media preview */}
            {mediaPreview && (
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 1 }}>
                {mediaPreview.type === 'video' ? (
                  <video src={mediaPreview.url} style={{ maxHeight: 200, borderRadius: 8 }} controls />
                ) : (
                  <img src={mediaPreview.url} alt="preview" style={{ maxHeight: 200, borderRadius: 8 }} />
                )}
                <IconButton
                  size="small"
                  onClick={removeMedia}
                  sx={{
                    position: 'absolute', top: 4, right: 4,
                    bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Attach Photo">
                  <IconButton component="label" size="small" color="primary">
                    <AddPhotoAlternate />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,video/*"
                      hidden
                      onChange={handleMediaChange}
                    />
                  </IconButton>
                </Tooltip>
                {media && (
                  <Chip
                    size="small"
                    icon={media.type?.startsWith('video/') ? <VideoFile /> : <Image />}
                    label={media.name?.length > 20 ? media.name.substring(0, 20) + '...' : media.name}
                    onDelete={removeMedia}
                  />
                )}
              </Box>
              <Button
                variant="contained" size="small"
                onClick={handlePost} disabled={loading || (!text.trim() && !media)}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send />}
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
      <Typography variant="h4" mb={1}>
        <AutoStories sx={{ mr: 1, verticalAlign: 'middle' }} />
        Reflections
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Share thoughts and experiences with the volunteer community
      </Typography>

      {/* Create Post */}
      <CreatePost currentUser={user} onPostCreated={handlePostCreated} />

      {/* Search */}
      <TextField
        fullWidth placeholder="Search posts..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        size="small" sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
        }}
      />

      {filtered.length === 0 && (
        <Alert severity="info">
          {search ? 'No posts match your search.' : 'No reflections yet. Be the first to post!'}
        </Alert>
      )}

      {filtered.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={user?.id}
          onUpdate={handlePostUpdated}
          onDelete={handlePostDeleted}
        />
      ))}
    </Box>
  );
};

export default ReflectionsFeed;