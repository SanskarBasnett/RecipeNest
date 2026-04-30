/**
 * @file User.model.js
 * @description Mongoose model for application users.
 *
 * Covers all three roles in the system:
 *  - `user`  — regular visitor who can browse, like, and comment on recipes.
 *  - `chef`  — content creator who can publish and manage recipes.
 *  - `admin` — platform administrator with full management access.
 *
 * Password hashing is handled automatically via a pre-save hook so that
 * plain-text passwords are never persisted to the database.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    /** Full display name of the user. Required and whitespace-trimmed. */
    name: { type: String, required: true, trim: true },

    /** Unique email address used for login. Stored in lowercase. */
    email: { type: String, required: true, unique: true, lowercase: true },

    /** Bcrypt-hashed password. Never returned in API responses (excluded via .select). */
    password: { type: String, required: true },

    /**
     * Role determines what the user can do in the application.
     *  - 'user'  → browse, like, comment
     *  - 'chef'  → all of the above + create/edit/delete own recipes
     *  - 'admin' → full platform management
     * Defaults to 'user' on registration.
     */
    role: { type: String, enum: ['user', 'chef', 'admin'], default: 'user' },

    /** URL path to the user's profile avatar image. Empty string if not set. */
    avatar: { type: String, default: '' },

    /** Short biography or description shown on the chef's public profile. */
    bio: { type: String, default: '' },

    // -----------------------------------------------------------------------
    // Chef-specific profile fields
    // These are only meaningful for users with role === 'chef', but are
    // stored on the same document to keep the schema simple.
    // -----------------------------------------------------------------------

    /** The chef's culinary specialty (e.g. "Italian cuisine", "Pastry"). */
    specialty: { type: String, default: '' },

    /** City or region where the chef is based. */
    location: { type: String, default: '' },

    /** Optional social media profile links for the chef's public page. */
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter:   { type: String, default: '' },
      youtube:   { type: String, default: '' },
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamp fields
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Pre-save Hook: Password Hashing
// Runs before every `save()` call. Only re-hashes the password when it has
// actually been modified (new user or explicit password change) to avoid
// double-hashing on unrelated document updates.
// ---------------------------------------------------------------------------
userSchema.pre('save', async function (next) {
  // Skip hashing if the password field hasn't changed
  if (!this.isModified('password')) return next();

  // Hash with a salt factor of 10 (good balance of security vs. performance)
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/**
 * Instance Method: matchPassword
 *
 * Compares a plain-text password against the stored bcrypt hash.
 * Used during login to verify credentials without exposing the hash.
 *
 * @param {string} enteredPassword - The plain-text password from the login request.
 * @returns {Promise<boolean>} Resolves to `true` if the passwords match.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
