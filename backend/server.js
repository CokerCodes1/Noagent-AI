const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();

const { initDatabase } = require("./config/db");

const PORT = Number(process.env.PORT || 5003);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function startServer() {
  await initDatabase();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: FRONTEND_URL,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  app.set("io", io);

  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.get("/", (req, res) => {
    res.json({ message: "Property listing API is running." });
  });

  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/property", require("./routes/property"));
  app.use("/api/landlord", require("./routes/landlord"));
  app.use("/api/payment", require("./routes/payment"));
  app.use("/api/admin", require("./routes/admin"));
  app.use("/api/admin/technicians", require("./routes/adminTechnicians"));
  app.use("/api/technicians", require("./routes/technician"));

  // Public testimonials endpoint
  app.get("/api/testimonials", async (req, res, next) => {
    try {
      const { getPool } = require("./config/db");
      const pool = getPool();
      const [rows] = await pool.execute(
        "SELECT id, name, role, video_url, avatar_url, rating, text_content, created_at FROM testimonials ORDER BY created_at DESC LIMIT 6"
      );

      return res.json({
        testimonials: rows.map(row => ({
          id: row.id,
          name: row.name,
          role: row.role,
          videoUrl: row.video_url,
          avatarUrl: row.avatar_url,
          rating: row.rating,
          textContent: row.text_content,
          createdAt: row.created_at
        }))
      });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong.";

    console.error(error);
    res.status(statusCode).json({ message });
  });

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
