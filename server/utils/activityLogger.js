const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, description, req = null, metadata = {}) => {
  try {
    const logData = {
      userId,
      action,
      description,
      metadata
    };

    // Add IP address and user agent if request object is provided
    if (req) {
      logData.ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      logData.userAgent = req.headers['user-agent'];
    }

    const activityLog = new ActivityLog(logData);
    await activityLog.save();
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

module.exports = { logActivity }; 