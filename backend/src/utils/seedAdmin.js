const User = require('../models/User.model');

/**
 * Seeds a default admin account on server startup.
 * Credentials: username = "admin", password = "admin@123"
 * Skips if admin already exists.
 */
const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ role: 'admin' });
    if (exists) return; // Admin already exists, skip

    await User.create({
      name:     'Admin',
      email:    'admin@gmail.com',
      password: 'admin@123',
      role:     'admin',
    });

    console.log('✅ Default admin created — email: admin@gmail.com | password: admin@123');
  } catch (err) {
    console.error('❌ Failed to seed admin:', err.message);
  }
};

module.exports = seedAdmin;
