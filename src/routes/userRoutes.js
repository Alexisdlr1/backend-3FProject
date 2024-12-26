const express = require("express");
const { createUser, getAllUsers, loginUser, checkWallet, updateUser, getUserById, getReferersCommissions } = require("../controllers/userController");

const router = express.Router();

// Iniciar sesión
router.post("/login", loginUser);

// Ruta para validar una wallet
router.post("/check-wallet", checkWallet);

// Ruta para crear un usuario
router.post("/", createUser);

// Ruta para obtener todos los usuarios
router.get("/", getAllUsers);

// Ruta para obtener usuario por id
router.get("/:id", getUserById);

// Ruta para obtener arbol de referidos
router.get("/referers/:wallet", getReferersCommissions);

// Ruta para actualizar un campo de un usuario por id
router.put("/:id", updateUser);

module.exports = router;