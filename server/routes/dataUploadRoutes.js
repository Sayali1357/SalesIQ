const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  uploadDataset,
  addRows,
  listDatasets,
  deleteDataset,
  manualRetrain,
  previewDataset
} = require('../controllers/dataUploadController');

// Multer configuration — temp upload directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '..', '..', 'data', 'uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `upload_${uniqueSuffix}_${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only CSV files
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// All routes require authentication
router.use(protect);

// Public routes (any authenticated user can view datasets)
router.get('/datasets', listDatasets);
router.get('/preview/:datasetName', previewDataset);

// Admin-only routes
router.post('/upload', authorize('Admin'), upload.single('file'), uploadDataset);
router.post('/add-rows', authorize('Admin'), addRows);
router.post('/retrain', authorize('Admin'), manualRetrain);
router.delete('/:datasetName', authorize('Admin'), deleteDataset);

module.exports = router;
