const express = require("express");
const cors = require("cors");
require("dotenv").config();

// --- Initialize App ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Enhanced Request Logging Middleware ---
app.use((req, res, next) => {
  const start = process.hrtime.bigint(); // Capture high-resolution start time

  // Log request details immediately upon receipt
  const userAgent = req.get("User-Agent") || "N/A";
  const remoteIp = req.ip || req.connection.remoteAddress || "N/A";
  const method = req.method;
  const path = req.originalUrl;
  const timestamp = new Date().toISOString();

  // Log the request details
  console.log(
    `[${timestamp}] - ${remoteIp} - ${method} ${path} - User-Agent: "${userAgent}"`
  );

  // Attach an event listener to 'finish' (when response headers and body are sent)
  res.on("finish", () => {
    const end = process.hrtime.bigint(); // Capture high-resolution end time
    const latencyNs = end - start; // Latency in nanoseconds
    const latencyMs = Number(latencyNs) / 1_000_000; // Convert to milliseconds

    // Log the latency after the request is finished
    console.log(
      `[${timestamp}] - ${remoteIp} - ${method} ${path} - Latency: ${latencyMs.toFixed(
        2
      )}ms`
    );
  });

  next(); // Pass the request to the next middleware/route handler
});

// --- Import Routes ---
const authRoutes = require("./routes/auth");
const workspaceRoutes = require("./routes/workspaces");
const budgetRoutes = (require = "./routes/budgets");
const taskRoutes = require("./routes/tasks");
const guestRoutes = require("./routes/guests");
const configRoutes = require("./routes/configs");
const mediaRoutes = require("./routes/media");
const noteRoutes = require("./routes/notes");
const dashboardRoutes = require("./routes/dashboard");
const memberRoutes = require("./routes/members");

// --- Use Routes ---
// Attach routers with a common prefix /api
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
// Budget and task routes already have prefixes in their router files
app.use("/api", budgetRoutes);
app.use("/api", taskRoutes);
app.use("/api", guestRoutes);
app.use("/api", configRoutes);
app.use("/api", mediaRoutes);
app.use("/api", noteRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", memberRoutes);

// --- Server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running at http://0.0.0.0:${PORT}`);
  console.log(
    `Access it from outside the container via http://localhost:${PORT} (on your host machine)`
  );
});
