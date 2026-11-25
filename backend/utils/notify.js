const Notification = require('../models/Notification');

async function createNotification({ recipient, title, message, type = 'system', link = '/' }) {
  if (!recipient) return null;
  try {
    return await Notification.create({ recipient, title, message, type, link });
  } catch (err) {
    // Non-blocking notification helper
    return null;
  }
}

module.exports = { createNotification };
