require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const departmentRoutes = require('./routes/departmentRoutes');
const requestTypeRoutes = require('./routes/requestTypeRoutes');
const { seedInitialRequestTypes } = require('./services/requestTypeService');
const requestStatusRoutes = require('./routes/requestStatusRoutes');
const { seedRequestStatuses } = require('./services/requestStatusService');
const documentTypeRoutes = require('./routes/documentTypeRoutes');
const { seedInitialDocumentTypes } = require('./services/documentTypeService');
const schoolRoutes = require('./routes/schoolRoutes');
const { seedInitialSchools } = require('./services/schoolService');
const programmeRoutes = require('./routes/programmeRoutes');
const { seedInitialProgrammes } = require('./services/programmeService');
const { seedInitialDepartments } = require('./services/departmentService');
const specialisationRoutes = require('./routes/specialisationRoutes');
const { seedInitialSpecialisations } = require('./services/specialisationService');
const { sendSuccess, sendError } = require('./utils/response');
const { HTTP_STATUS, MESSAGES, STATUS } = require('./config/constants');

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
  return sendSuccess(res, null, MESSAGES.SERVER_RUNNING, HTTP_STATUS.OK);
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/request-types', requestTypeRoutes);
app.use('/api/statuses', requestStatusRoutes);
app.use('/api/document-types', documentTypeRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/specialisations', specialisationRoutes);

// ==========================================
// Error Handling
// ==========================================
// Catch-all for undefined routes (Express 5 compatible)
app.use((req, res) => {
  return sendError(res, MESSAGES.ROUTE_NOT_FOUND(req.originalUrl), HTTP_STATUS.NOT_FOUND);
});

app.use(errorHandler);


// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  // Seed request types table with initial data if needed
  seedInitialRequestTypes().then(() => {
    console.log('✅ Request types seeded (if table was empty)');
  }).catch((err) => {
    console.error('❌ Error seeding request types:', err);
  });
  seedRequestStatuses().then(() => {
    console.log('✅ Request statuses seeded (if table was empty)');
  }).catch((err) => {
    console.error('❌ Error seeding request statuses:', err);
  });
  seedInitialDocumentTypes().then(() => {
    console.log('✅ Document types seeded (if table was empty)');
  }).catch((err) => {
    console.error('❌ Error seeding document types:', err);
  });
  seedInitialSchools().then(() => {
    console.log('✅ Schools seeded (if table was empty)');
  }).catch((err) => {
    console.error('❌ Error seeding schools:', err);
  });
  seedInitialProgrammes().then(() => {
    console.log('✅ Programmes seeded (if table was empty)');
  }).catch((err) => {
    console.error('❌ Error seeding programmes:', err);
  });
  seedInitialDepartments().then(() => {
    console.log('✅ Departments seeded (if table was empty)');
  }).catch((err) => {
    console.error('❌ Error seeding departments:', err);
  });
  seedInitialSpecialisations().then(() => {
    console.log('✅ Specialisations seeded (if table was empty)');
  }).catch((err) => {
    console.error('❌ Error seeding specialisations:', err);
  });
});