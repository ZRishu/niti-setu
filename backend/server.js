import 'dotenv/config';
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import connectDB from "./config/db.js";
import swaggerUi from "swagger-ui-express.js";
import swaggerSpecs from "./config/swagger.js";
import schemeRoutes from './routes/schemeRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// calling to connect mongodb
connectDB();

//Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// docs for routing using swagger-ui and ingesting pdf scheme route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/v1/schemes', schemeRoutes);
app.use('/api/v1/auth', authRoutes);
// route for test or heath check
app.get("/", (req, res) => {
  res.send("Niti-Setu API is running...");
});

//Start server on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
