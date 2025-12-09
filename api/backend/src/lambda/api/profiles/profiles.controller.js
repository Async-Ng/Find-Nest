import * as profileService from "./profiles.service.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await profileService.getUserProfile(userId);
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hồ sơ người dùng." });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error("Lỗi Controller - getProfile:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updatedProfile = await profileService.updateUserProfile(
      userId,
      req.body
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error("Lỗi Controller - updateProfile:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
