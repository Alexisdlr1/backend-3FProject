const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const crypto = require("crypto");
const userRoutes = require("./routes/userRoutes");
const whiteListRoutes = require("./routes/whiteListRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const GITHUB_SECRET = process.env.GITHUB_SECRET || "mySuperSecretKey123!";

const app = express();

// Middleware de CORS
const corsOptions = {
  origin: ["http://localhost:3000", "https://3-f-project-nextjs.vercel.app/"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Usar express.json() para que el cuerpo de las solicitudes POST se maneje como JSON
app.use(express.json()); // Esta línea es importante

// Middleware para CORS
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.status(200).send("Working?.");
});

// Rutas
app.use("/f3api/users", userRoutes);
app.use("/f3api/whiteList", whiteListRoutes);
app.use("/f3api/transaction", transactionRoutes);

// Endpoint para recibir el webhook de GitHub
app.post("/f3api/webhook", (req, res) => {
  // Validar tipo de evento
  const event = req.headers["x-github-event"];
  if (event !== "push") {
    return res.status(400).json({ message: "Evento no soportado." });
  }

  // Validar la firma del webhook
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    console.error("Firma no proporcionada.");
    return res.status(400).json({ message: "Firma no proporcionada." });
  }

  // Crear el hash HMAC usando el secreto
  const payload = JSON.stringify(req.body); // Asegúrate de que el payload esté en formato JSON
  const hmac = crypto.createHmac("sha256", GITHUB_SECRET);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  if (signature !== digest) {
    console.error("Firma inválida. La solicitud no proviene de GitHub.");
    return res.status(401).json({ message: "Firma inválida. Acceso no autorizado." });
  }

  console.log("Firma válida. Procesando webhook...");

  // Verificar si es un push a la rama principal
  if (req.body.ref === "refs/heads/main") {
    console.log("Webhook recibido: Ejecutando git pull...");

    // Ejecutar el comando git pull
    exec("cd /home/freefriendsandfamily/backend-3FProject && git pull --no-rebase", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar git pull: ${error.message}`);
        console.error(`Stack completo: ${error.stack}`);
        return res.status(500).send(`Error al ejecutar git pull: ${error.message}`);
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      console.log(`stdout: ${stdout}`);
      console.log("git pull ejecutado con éxito. Procediendo a recargar el servidor con PM2...");

      // Recargar el servidor con PM2
      exec("pm2 reload backend", (reloadError, reloadStdout, reloadStderr) => {
        if (reloadError) {
          console.error(`Error al recargar el servidor: ${reloadError.message}`);
          return res.status(500).send("Error al recargar el servidor.");
        }

        if (reloadStderr) {
          console.error(`stderr: ${reloadStderr}`);
        }

        console.log(`stdout: ${reloadStdout}`);
        res.status(200).send("Repositorio actualizado y servidor recargado correctamente.");
      });
    });
  } else {
    console.log("No es un push a la rama principal. Ignorando.");
    res.status(400).json({ message: "Evento no relevante." });
  }
});

const mongoose = require("mongoose");

// Endpoint para health check
app.get("/f3api/health", async (req, res) => {
  try {
    // Verificar conexión con la base de datos
    const isDatabaseConnected = await checkDatabaseConnection();

    if (isDatabaseConnected) {
      res.status(200).json({
        status: "ok",
        server: "online",
        database: "connected",
      });
    } else {
      throw new Error("No se pudo conectar a la base de datos");
    }
  } catch (error) {
    console.error("Error en el health check:", error.message);
    res.status(500).json({
      status: "error",
      server: "online",
      database: "disconnected",
    });
  }
});

// Función para verificar la conexión a la base de datos
const checkDatabaseConnection = async () => {
  try {
    const db = mongoose.connection;
    if (db.readyState === 1) {
      await db.db.admin().ping();
      console.log("Conexión con la base de datos establecida.");
      return true;
    } else {
      console.error("La conexión con la base de datos no está activa.");
      return false;
    }
  } catch (error) {
    console.error("Error al verificar la conexión a la base de datos:", error.message);
    return false;
  }
};

app.use((req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

module.exports = app;