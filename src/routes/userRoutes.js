const express = require("express");
const { 
  createUser,
  getAllUsers,
  loginUser,
  checkWallet,
  updateUser,
  getUserById,
  getReferersCommissions,
  resetPassword,
  getNotificationsBySingleEmail,
  addWithdrawWallet,
  disableWithdrawWallet
} = require("../controllers/userController");

const router = express.Router();

// Iniciar sesión
router.post("/login", loginUser);

// Ruta para validar una wallet
router.post("/check-wallet", checkWallet);

// Ruta para crear un usuario
router.post("/", createUser);

// Cambiar contraseña
router.post("/resetPassword", resetPassword);

// Obtener notificaciones by email
router.post("/notifications", getNotificationsBySingleEmail);

// Agregar wallet para retiro
router.post("/addWallet/:id", addWithdrawWallet);

// Desactivar wallet para retiro
router.post("/disableWallet/:id", disableWithdrawWallet);

// Ruta para obtener todos los usuarios
router.get("/", getAllUsers);

// Ruta para obtener usuario por id
router.get("/:id", getUserById);

// Ruta para obtener arbol de referidos
router.get("/referers/:wallet", getReferersCommissions);

// Ruta para actualizar un campo de un usuario por id
router.put("/:id", updateUser);


module.exports = router;