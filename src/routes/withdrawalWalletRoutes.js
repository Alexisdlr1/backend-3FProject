const express = require("express");
const { addWithdrawWallet, updateWithdrawalWallet, deleteWithdrawalWallet } = require("../controllers/withdrawalWalletController");

const router = express.Router();

// Agregar wallet secundaria
router.post("/add/:id", addWithdrawWallet);

// Actualizar wallet secundaria
router.put("/update/:id", updateWithdrawalWallet);

// Eliminar wallet secundaria
router.put("/delete/:id", deleteWithdrawalWallet);

module.exports = router;