const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  analyzeImageController,
} = require("../controllers/multimedia.controller");

const router = express.Router();

// =============================================
// MULTER STORAGE
// Preserve original image extension
// =============================================

const storage = multer.diskStorage({
  destination: "uploads/multimedia/",

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =============================================
// ANALYZE IMAGE
// =============================================

router.post(
  "/image",

  (req, res, next) => {
    console.log("📨 Multimedia POST route reached");

    next();
  },

  upload.single("image"),

  analyzeImageController,
);

module.exports = router;
