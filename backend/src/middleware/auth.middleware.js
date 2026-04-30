/**
 * @file auth.middleware.js
 * @description Authentication and authorization middleware for Express routes.
 *
 * Exports two middleware functions:
 *  - `protect`   — verifies the JWT in the Authorization header and attaches
 *                  the authenticated user to `req.user`.
 *  - `authorize` — restricts access to routes based on user role(s).
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Middleware: protect
 *
 * Validates the Bearer JWT token sent in the `Authorization` request header.
 * On success, the decoded user document (without the password field) is
 * attached to `req.user` so downstream handlers can identify the caller.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
const protect = async (req, res, next) => {
  let token;

  // Check that the Authorization header exists and uses the Bearer scheme
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token string after "Bearer "
      token = req.headers.authorization.split(' ')[1];

      // Verify the token signature and expiry against the app secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the full user document and attach it to the request.
      // The password field is excluded so it is never accidentally exposed.
      req.user = await User.findById(decoded.id).select('-password');

      return next();
    } catch (error) {
      // Token is malformed, expired, or the secret doesn't match
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // No token was found in the header at all
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware factory: authorize
 *
 * Returns an Express middleware that allows the request to proceed only if
 * the authenticated user's role is included in the provided `roles` list.
 * Must be used **after** `protect` so that `req.user` is already populated.
 *
 * @param {...string} roles - One or more allowed role strings (e.g. 'admin', 'chef').
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Only admins may access this route
 * router.delete('/users/:id', protect, authorize('admin'), deleteUser);
 *
 * @example
 * // Both chefs and admins may access this route
 * router.put('/:id', protect, authorize('chef', 'admin'), updateRecipe);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // If the user's role is not in the allowed list, reject the request
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' is not authorized` });
    }
    next();
  };
};

module.exports = { protect, authorize };
