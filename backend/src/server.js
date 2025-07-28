require('dotenv').config({ path: __dirname + '/.env' });
// require('dotenv').config()
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('express-async-errors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const corsConfig = require('./config/corsConfig')
const { scheduleAutoRejection } = require('./services/autoRejectionService');



// Connect to database
connectDB();


// Schedule auto-rejection job
const autoRejectionJob = scheduleAutoRejection();

// Route files
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointment');
const walkInRoutes = require('./routes/walkIn');
const barberRoutes = require('./routes/barberRoutes')
const workingHoursRoutes = require('./routes/workingHours');
const blockedSlotRoutes = require('./routes/blockedSlot');
const waitingQueueRoutes = require('./routes/waitingQueue');
const availableSlotsRoutes = require('./routes/availableSlots');
const dashboardRoutes = require('./routes/dashboard');



const app = express();

console.log("🔍 Environment Check:");
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("MONGO_URI:", process.env.MONGO_URI ? "✔️ Set" : "❌ Not Set");
console.log("EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");


// solve cors errors
app.use(cors(corsConfig))

app.options('*', cors(corsConfig)); // handles preflight

app.use((req, res, next) => {
  next();
});

const log = console.log;
console.log = function (...args) {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    args[0].includes('Decoded User from JWT')
  ) {
    return; // suppress that specific log
  }
  log.apply(console, args);
};

// Body parser
app.use(express.json());

// Set security headers
app.use(helmet());



app.use((req, res, next) => {
  next();
});


// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/walkins', walkInRoutes);
app.use('/api/working-hours', workingHoursRoutes);
app.use('/api/blocked-slots', blockedSlotRoutes);
app.use('/api/waiting-queue', waitingQueueRoutes);
app.use('/api/dashboard', dashboardRoutes);


// Root endpoint
app.get('/', (req, res) => {
  res.send('Barbershop API is running');
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});