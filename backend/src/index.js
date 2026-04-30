/**
 * @file index.js
 * @description Entry point for the RecipeNest Express API server.
 * Configures middleware, mounts route handlers, connects to MongoDB,
 * runs seed utilities on startup, and handles graceful shutdown.
 */

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');
const fs       = require('fs');

// Seed utilities — run once on startup to ensure baseline data exists
const seedAdmin      = require('./utils/seedAdmin');
const seedCategories = require('./utils/seedCategories');
const seedChefs      = require('./utils/seedChefs');
const seedRecipes    = require('./utils/seedRecipes');

// Load environment variables from backend/.env into process.env
dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// Ensure the uploads directory exists before serving static files from it.
// If the folder is missing (e.g. fresh clone), create it recursively so that
// multer and express.static don't throw on first use.
// ---------------------------------------------------------------------------
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

/**
 * CORS — allow requests from the React development server (port 3000).
 * `credentials: true` is required so the browser sends the Authorization
 * header with cross-origin requests.
 */
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

/**
 * Serve uploaded images as static files under the /uploads URL prefix.
 * e.g. GET /uploads/recipe-biryani.jpg → backend/uploads/recipe-biryani.jpg
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---------------------------------------------------------------------------
// Route Mounting — each feature domain has its own router module
// ---------------------------------------------------------------------------
app.use('/api/auth',          require('./routes/auth.routes'));          // Authentication & user identity
app.use('/api/chefs',         require('./routes/chef.routes'));          // Chef profiles
app.use('/api/recipes',       require('./routes/recipe.routes'));        // Recipe CRUD, likes, comments
app.use('/api/admin',         require('./routes/admin.routes'));         // Admin-only management
app.use('/api/categories',    require('./routes/category.routes'));      // Recipe categories
app.use('/api/notifications', require('./routes/notification.routes')); // In-app notifications

// ---------------------------------------------------------------------------
// Health Check
// A simple root endpoint so load balancers / uptime monitors can verify the
// server is alive without hitting the database.
// ---------------------------------------------------------------------------
app.get('/', (req, res) => res.json({ message: 'RecipeNest API running' }));

// ---------------------------------------------------------------------------
// Database Connection & Server Bootstrap
// ---------------------------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');

    // Run seed functions to populate default data if collections are empty.
    // seedChefs / seedRecipes are awaited because seedRecipes depends on
    // chef documents already existing in the database.
    seedAdmin();
    seedCategories();
    await seedChefs();
    await seedRecipes();

    // Start the HTTP server on the port defined in .env
    const server = app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );

    // -----------------------------------------------------------------------
    // Graceful Shutdown
    // Listen for SIGINT (Ctrl+C) so in-flight requests can finish and the
    // MongoDB connection is closed cleanly before the process exits.
    // -----------------------------------------------------------------------
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      server.close(() => {
        // false = don't force-close active connections
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed. Bye!');
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
