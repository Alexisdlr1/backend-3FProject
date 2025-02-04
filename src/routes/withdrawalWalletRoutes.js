const express = require("express");
const { addWithdrawWallet, updateWithdrawalWallet } = require("../controllers/withdrawalWalletController");

const router = express.Router();

// Agregar wallet para retiro
router.post("/add/:id", addWithdrawWallet);

// Actualizar wallet para retiro
router.put("/update/:id", updateWithdrawalWallet);

module.exports = router;