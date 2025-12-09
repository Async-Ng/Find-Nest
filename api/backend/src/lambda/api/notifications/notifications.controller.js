import * as notificationsService from "./notifications.service.js";

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;

    const notifications = await notificationsService.getUserNotifications(
      userId,
      parseInt(limit)
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to get notifications"
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    await notificationsService.markAsRead(userId, notificationId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to mark notification as read"
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await notificationsService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to mark all as read"
    });
  }
};
