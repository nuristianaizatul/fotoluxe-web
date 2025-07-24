// index.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./routes/index.js";
import db from "./config/Database.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

async function startServer() {
  try {
    await db.authenticate();
    console.log("Database Connected...");
    await db.sync({ alter: true });

    // Middleware
    app.use(cors({
      credentials: true,
      origin: "http://localhost:3000"
    }));
    app.use(cookieParser());
    app.use(express.json());
    
    // Serve static files dari middleware/uploads
    app.use('/uploads', express.static(path.join(__dirname, 'middleware', 'uploads')));
    
    // Router
    app.use(router);

    // Jalankan server
    app.listen(5000, () => console.log("Server running on port 5000"));
  } catch (error) {
    console.error("DB Connection Failed", error);
  }
}

startServer();