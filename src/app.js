const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const whiteListRoutes = require("./routes/whiteListRoutes");

const app = express();

// Middleware de CORS
const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware para manejar JSON
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("API funcionando correctamente.");
});

// Rutas
app.use("/f3api/users", userRoutes);

app.use("/f3api/whiteList", whiteListRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

module.exports = app;