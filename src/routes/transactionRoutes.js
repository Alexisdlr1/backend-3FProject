const express = require("express");
const { createTransaction, getGroupedTransactions } = require("../controllers/transactionController");

const router = express.Router();

// Ruta para obtener las transacciones
router.get("/", getGroupedTransactions);

// Ruta para crear una transacción
router.post("/", createTransaction);

module.exports = router;