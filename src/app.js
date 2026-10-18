
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
const authRoutes = require("./routes/auth.routes");
const bookingRoutes = require("./routes/booking.routes");

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VentureVista backend is running",
  });
});

// Auth routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", bookingRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
