const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const whiteListRoutes = require("./routes/whiteListRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

// Middleware de CORS
const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Usar express.json() para que el cuerpo de las solicitudes POST se maneje como JSON
app.use(express.json()); // Esta línea es importante

// Middleware para CORS
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.status(200).send("API funcionando correctamente.");
});

// Rutas
app.use("/f3api/users", userRoutes);
app.use("/f3api/whiteList", whiteListRoutes);
app.use("/f3api/transaction", transactionRoutes);

// Ruta para recibir el webhook de GitHub
app.post("/f3api/webhook", (req, res) => {
  console.log("Webhook recibido:", req.body);
  res.status(200).send("Webhook procesado correctamente.");
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

module.exports = app;