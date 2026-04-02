const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    cb(null, `${Date.now()}-${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 6,
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "images" && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    if (file.fieldname === "video" && file.mimetype.startsWith("video/")) {
      return cb(null, true);
    }

    return cb(new Error("Only image files for images and video files for video are allowed."));
  }
});

module.exports = upload;
