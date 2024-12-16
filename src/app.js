const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
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

app.use(cors(corsOptions));

// Middleware para manejar JSON
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("API funcionando correctamente.");
});

// Rutas
app.use("/f3api/users", userRoutes);

app.use("/f3api/whiteList", whiteListRoutes);

app.use("/f3api/transaction", transactionRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

// Endpoint para recibir el webhook de GitHub
app.post("/f3api/webhook", (req, res) => {
  // Verifica si es un push a la rama principal (refs/heads/main)
  if (req.body.ref === "refs/heads/main") {
    console.log("Webhook recibido: Ejecutando git pull...");

    exec("cd backend-3FProject && git pull", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar git pull: ${error.message}`);
        return res.status(500).json({ message: "Error al actualizar el repositorio." });
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      console.log(`git pull stdout: ${stdout}`);
      console.log("Repositorio actualizado. Reiniciando p2...");

      // Ejecuta p2 restart para reiniciar el servidor
      exec("p2 restart", (restartError, restartStdout, restartStderr) => {
        if (restartError) {
          console.error(`Error al reiniciar p2: ${restartError.message}`);
          return res.status(500).json({ message: "Error al reiniciar el servidor." });
        }

        if (restartStderr) {
          console.error(`p2 restart stderr: ${restartStderr}`);
        }

        console.log(`p2 restart stdout: ${restartStdout}`);
        res.status(200).json({ message: "Repositorio actualizado y servidor reiniciado correctamente." });
      });
    });
  } else {
    console.log("No es un push a la rama principal. Ignorando.");
    res.status(400).json({ message: "Evento no relevante." });
  }
});

module.exports = app;