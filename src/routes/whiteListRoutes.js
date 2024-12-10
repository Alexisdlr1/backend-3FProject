const express = require("express");
const { getWhiteListUsers, createWhiteListUser, updateWhiteListUser, deleteWhiteListUser } = require("../controllers/whiteListController");

const router = express.Router();

// Ruta para obtener todos los usuarios por aprobar
router.get("/", getWhiteListUsers);

// Ruta para crear un usario por aprobar
router.post("/create-white-list", createWhiteListUser);

// Ruta para actualizar un campo de un usuario por id
router.put("/:id", updateWhiteListUser);

// Ruta para eliminar un usuario por id
router.delete("/:id", deleteWhiteListUser);

module.exports = router;