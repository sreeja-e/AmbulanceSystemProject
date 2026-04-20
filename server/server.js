require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");

const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const driverRoutes = require("./routes/driverRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { initSockets } = require("./sockets");

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/request", requestRoutes);
app.use("/driver", driverRoutes);
app.use("/admin", adminRoutes);

app.use((err, req, res, next) => {
  const _next = next;
  console.error(err);
  if (err?.message === "Missing token" || err?.message === "Invalid token") {
    return res.status(401).json({ message: err.message });
  }
  return res.status(500).json({ message: "Server error" });
});

const port = Number(process.env.PORT || 5000);
const server = http.createServer(app);

initSockets(server, {
  corsOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

