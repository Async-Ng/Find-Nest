import * as imageService from "./images.service.js";

// Generate upload URLs for multiple images
export const generateUploadUrls = async (req, res) => {
  try {
    const { files } = req.body; // Array of {fileName, contentType}
    const userId = req.user.userId;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Files array is required"
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        error: "BadRequest", 
        message: "Maximum 10 files allowed"
      });
    }

    // Validate file types and names
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!file.contentType || !allowedTypes.includes(file.contentType)) {
        return res.status(400).json({
          error: "BadRequest",
          message: `Invalid file type: ${file.contentType}. Allowed: ${allowedTypes.join(', ')}`
        });
      }
      if (!file.fileName) {
        file.fileName = `image.${file.contentType.split('/')[1]}`;
      }
    }

    const uploadUrls = await imageService.generateMultipleUploadUrls(files, userId);

    res.status(200).json({
      success: true,
      uploads: uploadUrls
    });
  } catch (error) {
    console.error("Generate upload URLs error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to generate upload URLs"
    });
  }
};

// Delete image
export const deleteImage = async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.userId;

    // Verify user owns this image (key should contain userId)
    if (!key.includes(userId)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete your own images"
      });
    }

    await imageService.deleteImage(key);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      error: "ServerError", 
      message: "Failed to delete image"
    });
  }
};