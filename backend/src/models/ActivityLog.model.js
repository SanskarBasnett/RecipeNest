const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g. 'USER_REGISTER', 'RECIPE_CREATE', 'RECIPE_DELETE', etc.
    },
    actor: {
      id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      role: { type: String },
    },
    target: {
      type:  { type: String },   // e.g. 'user', 'recipe', 'chef'
      id:    { type: mongoose.Schema.Types.ObjectId },
      label: { type: String },
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
