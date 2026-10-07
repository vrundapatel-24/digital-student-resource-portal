const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Load database
require("./database");

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Study routes
const studyRoutes = require("./routes/study");
const examRoutes = require("./routes/exams");
const courseRoutes = require("./routes/courses");
const resourceRoutes = require("./routes/resources");
const practicalRoutes = require("./routes/practical");
const authRoutes = require("./routes/auth");
app.use("/api/study", studyRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/practical", practicalRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    message: "Backend server is healthy."
  });
});

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Digital Student Resource Portal Backend is running."
  });
});

// Start server
app.listen(PORT,"0.0.0.0", () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});