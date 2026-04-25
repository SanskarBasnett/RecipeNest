const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // The chef who receives the notification
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The user who triggered it
    sender: {
      id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name:   { type: String },
      avatar: { type: String, default: '' },
    },
    type:    { type: String, enum: ['like', 'comment'], required: true },
    recipe:  { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    recipeTitle: { type: String },
    // For comments — store the text snippet
    commentText: { type: String, default: '' },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
