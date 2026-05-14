require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const departmentRoutes = require('./routes/departmentRoutes');


// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware
// ==========================================
// Allow cross-origin requests from your frontend
app.use(cors()); 

// Parse incoming requests with JSON payloads
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes
// ==========================================
// A simple health-check route to verify the server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Dashboard API is running smoothly.' 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);

// ==========================================
// Error Handling
// ==========================================
// Catch-all for undefined routes (Express 5 compatible)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found.`
  });
});

app.use(errorHandler);


// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
});