const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const seedAdmin      = require('./utils/seedAdmin');
const seedCategories = require('./utils/seedCategories');
const seedChefs      = require('./utils/seedChefs');
const seedRecipes    = require('./utils/seedRecipes');

dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware — allow React dev server and same-origin requests
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/chefs',         require('./routes/chef.routes'));
app.use('/api/recipes',       require('./routes/recipe.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/categories',    require('./routes/category.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'RecipeNest API running' }));

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    seedAdmin();
    seedCategories();
    await seedChefs();
    await seedRecipes();
    const server = app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );

    // Graceful shutdown on Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down server...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed. Bye!');
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
