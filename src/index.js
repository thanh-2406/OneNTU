require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const departmentRoutes = require('./routes/departmentRoutes');
const { httpStatus, messages, status } = require('./config/constants');

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
  res.status(httpStatus.OK).json({ 
    status: status.SUCCESS, 
    message: messages.SERVER_RUNNING,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);

// ==========================================
// Error Handling
// ==========================================
// Catch-all for undefined routes (Express 5 compatible)
app.use((req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    status: status.ERROR,
    message: messages.ROUTE_NOT_FOUND(req.originalUrl),
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