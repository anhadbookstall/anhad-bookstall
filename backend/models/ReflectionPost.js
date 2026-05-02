const mongoose = require('mongoose');

const reflectionPostSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  text: { type: String, trim: true },
  media: {
    url: String,
    publicId: String,
    type: { type: String, enum: ['image', 'video'] },
  },
  // Multiple image attachments
  images: [{
    url: String,
    publicId: String,
  }],
  reactions: [{
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
    emoji: { type: String, required: true, enum: ['👍', '👎', '❤️', '🙏', '💡', '😡', '😕', '🪔'] },
  }],
  comments: [{
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('ReflectionPost', reflectionPostSchema);