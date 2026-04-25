const ActivityLog = require('../models/ActivityLog.model');

/**
 * Log an activity event.
 * @param {string} action  - e.g. 'RECIPE_CREATE'
 * @param {object} actor   - { id, name, role }
 * @param {object} [target] - { type, id, label }
 * @param {object} [meta]  - any extra data
 */
const logActivity = async (action, actor = {}, target = {}, meta = {}) => {
  try {
    await ActivityLog.create({ action, actor, target, meta });
  } catch (err) {
    // Non-critical — never let logging break the main flow
    console.error('Activity log error:', err.message);
  }
};

module.exports = logActivity;
