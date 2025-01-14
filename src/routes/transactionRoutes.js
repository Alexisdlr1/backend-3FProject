const express = require("express");
const { createTransaction, getGroupedTransactions, getTransactionAndBalanceById } = require("../controllers/transactionController");

const router = express.Router();

// Ruta para obtener las transacciones
router.get("/", getGroupedTransactions);

// Ruta para obtener las transacciones y balance por id
router.post("/:id", getTransactionAndBalanceById);

// Ruta para crear una transacción
router.post("/", createTransaction);

module.exports = router;