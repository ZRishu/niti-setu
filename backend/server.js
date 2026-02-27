import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import connectDB from "./config/db.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.js";
import schemeRoutes from './routes/schemeRoutes.js';
import authRoutes from './routes/authRoutes.js';


const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.originalUrl}`);
  next();
});
// calling to connect mongodb
connectDB();

//Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// docs for routing using swagger-ui and ingesting pdf scheme route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/v1/schemes', schemeRoutes);
app.use('/api/v1/auth', authRoutes);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "API Online", timestamp: new Date() });
});

app.use('/api/v1/*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found on Niti-Setu API` });
});

//Start server on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
