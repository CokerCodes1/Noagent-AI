const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  isLandlordVerificationDocumentExtension,
  isLandlordVerificationDocumentMime
} = require("../utils/landlordVerification");

const uploadsRootDir = path.join(__dirname, "..", "uploads");

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

ensureDirectoryExists(uploadsRootDir);

function createSafeFilename(file = {}) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const randomPrefix = crypto.randomUUID();

  return `${randomPrefix}${extension}`;
}

function createStorage(targetDirectory) {
  const destinationDir = path.join(uploadsRootDir, targetDirectory);
  ensureDirectoryExists(destinationDir);

  return multer.diskStorage({
    destination: destinationDir,
    filename: (req, file, callback) => {
      callback(null, createSafeFilename(file));
    }
  });
}

function createUpload({ directory, fileFilter, limits }) {
  return multer({
    storage: createStorage(directory),
    limits,
    fileFilter
  });
}

const mediaUpload = createUpload({
  directory: "",
  limits: {
    files: 6,
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (
      (file.fieldname === "images" || file.fieldname === "avatar") &&
      file.mimetype.startsWith("image/")
    ) {
      return callback(null, true);
    }

    if (file.fieldname === "video" && file.mimetype.startsWith("video/")) {
      return callback(null, true);
    }

    return callback(
      new Error("Only image files for images/avatar and video files for video are allowed.")
    );
  }
});

mediaUpload.documentUpload = createUpload({
  directory: "verification-documents",
  limits: {
    files: 1,
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname || "");
    const mime = String(file.mimetype || "").toLowerCase();

    if (file.fieldname !== "verificationDocument") {
      return callback(new Error("Unexpected upload field."));
    }

    if (
      !isLandlordVerificationDocumentExtension(extension) ||
      !isLandlordVerificationDocumentMime(mime)
    ) {
      return callback(
        new Error("Only JPG, JPEG, PNG, WEBP, and PDF files are allowed for verification documents.")
      );
    }

    return callback(null, true);
  }
});

module.exports = mediaUpload;
