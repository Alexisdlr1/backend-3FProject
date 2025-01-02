const express = require("express");
const { sendWelcome } = require("../controllers/sendgridController");

const router = express.Router();

// Ruta para enviar el correo de bienvenida
router.post("/welcome", sendWelcome);

module.exports = router;
