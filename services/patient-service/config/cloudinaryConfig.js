const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Connect to your Cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Tell Cloudinary where and how to store files
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'medical-reports',  // folder name in your Cloudinary account
    resource_type: 'auto',             // auto detect pdf, image, etc
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    // Give each file a unique name using timestamp
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.replace(/\s+/g, '-');
      return `report-${req.user.id}-${timestamp}-${originalName}`;
    }
  }
});

// File filter — only allow these file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // accept file
  } else {
    cb(new Error('Only JPG, PNG and PDF files are allowed'), false); // reject
  }
};

// Final multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB max file size
  }
});

module.exports = { cloudinary, upload };