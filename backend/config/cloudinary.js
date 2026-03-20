// config/cloudinary.js - Cloudinary setup for photo storage
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for purchaser photos - auto-deleted after 6 months via Cloudinary transformation
const purchaserPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookstall/purchasers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    // Note: Set 6-month auto-delete in Cloudinary Dashboard -> Media Library -> Settings
  },
});

// Storage for volunteer profile photos
const volunteerPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookstall/volunteers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

const uploadPurchaserPhoto = multer({ storage: purchaserPhotoStorage });
// Storage for reflection post media (images and videos)
const reflectionMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bookstall/reflections',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi', 'webm'],
    transformation: [{ width: 1080, crop: 'limit' }],
  },
});

const uploadReflectionMedia = multer({
  storage: reflectionMediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

const uploadVolunteerPhoto = multer({ storage: volunteerPhotoStorage });

// Delete a photo from Cloudinary by its public_id
const deletePhoto = async (publicId) => {
  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
};

module.exports = { cloudinary, uploadPurchaserPhoto, uploadVolunteerPhoto, uploadReflectionMedia, deletePhoto };