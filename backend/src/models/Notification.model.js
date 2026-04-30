/**
 * @file Notification.model.js
 * @description Mongoose model for in-app notifications sent to chefs.
 *
 * A notification is created whenever another user interacts with a chef's
 * recipe — specifically when someone likes or comments on it. The chef can
 * then view these notifications in their dashboard and mark them as read.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    /**
     * The chef who receives this notification.
     * References the User collection so we can query all notifications
     * for a specific chef efficiently.
     */
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /**
     * Snapshot of the user who triggered the notification (liker / commenter).
     * Stored inline rather than as a reference so the notification remains
     * readable even if the sender's account is later deleted.
     */
    sender: {
      /** MongoDB ObjectId of the sender — used for deduplication queries. */
      id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      /** Display name of the sender at the time the notification was created. */
      name:   { type: String },
      /** Avatar URL of the sender at the time the notification was created. */
      avatar: { type: String, default: '' },
    },

    /**
     * The type of interaction that triggered this notification.
     *  - 'like'    → a user liked the chef's recipe
     *  - 'comment' → a user commented on the chef's recipe
     */
    type: { type: String, enum: ['like', 'comment'], required: true },

    /** Reference to the recipe that was liked or commented on. */
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },

    /**
     * Snapshot of the recipe title at the time the notification was created.
     * Stored inline so the notification text remains accurate even if the
     * recipe title is later edited.
     */
    recipeTitle: { type: String },

    /**
     * For 'comment' notifications — a truncated preview of the comment text
     * (up to 120 characters) shown in the notification feed.
     * Empty string for 'like' notifications.
     */
    commentText: { type: String, default: '' },

    /**
     * Whether the chef has read this notification.
     * Used to drive the unread badge count in the UI.
     * Defaults to false (unread) on creation.
     */
    read: { type: Boolean, default: false },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamp fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
