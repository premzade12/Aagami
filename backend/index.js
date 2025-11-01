// server.js

import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import geminiResponse from "./gemini.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// CORS config for frontend (Vite)
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? "https://virtual-assistant-biz3.onrender.com" 
    : "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Test route
app.get("/", (req, res) => {
  // let prompt = req.query.prompt;
  // let data = await geminiResponse(prompt);
  // res.json(data);
  res.send("Server is up and running ✅");
});

// Connect to DB and start server
const port = process.env.PORT || 5000;
connectDb().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server started on PORT: ${port}`);
  });
}).catch((err) => {
  console.error("❌ Failed to connect to MongoDB", err);
});
