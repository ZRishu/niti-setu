import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.js";

const app = express();

// calling to connect mongodb
connectDB();

//Middleware
app.use(cors());
app.use(express.json());

// docs for routing using swagger-ui
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

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
