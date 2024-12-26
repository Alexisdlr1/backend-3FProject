const express = require("express");
const { createTransaction, getGroupedTransactions, getTransactionById } = require("../controllers/transactionController");

const router = express.Router();

// Ruta para obtener las transacciones
router.get("/", getGroupedTransactions);

// Ruta para obtener las transacciones por id
router.get("/:id", getTransactionById);

// Ruta para crear una transacción
router.post("/", createTransaction);

module.exports = router;