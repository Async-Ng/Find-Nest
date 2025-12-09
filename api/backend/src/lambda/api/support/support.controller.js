import * as supportService from "./support.service.js";

export const createSupportRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Subject and message are required"
      });
    }

    const request = await supportService.createSupportRequest(userId, {
      type,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      message: "Support request created successfully",
      request
    });
  } catch (error) {
    console.error("Create support request error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to create support request"
    });
  }
};

export const getSupportRequests = async (req, res) => {
  try {
    const requests = await supportService.getAllSupportRequests();
    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Get support requests error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to retrieve support requests"
    });
  }
};

export const updateSupportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminResponse } = req.body;

    if (!["PENDING", "APPROVED", "REJECTED", "RECEIVED", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid status"
      });
    }

    const updatedRequest = await supportService.updateRequestStatus(
      requestId,
      status,
      adminResponse
    );

    res.status(200).json({
      success: true,
      message: "Support request updated successfully",
      request: updatedRequest
    });
  } catch (error) {
    console.error("Update support request error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to update support request"
    });
  }
};