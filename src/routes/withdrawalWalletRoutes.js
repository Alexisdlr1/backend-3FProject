const express = require("express");
const { addWithdrawWallet, updateWithdrawalWallet } = require("../controllers/withdrawalWalletController");

const router = express.Router();

// Agregar wallet para retiro
router.post("/addWallet/:id", addWithdrawWallet);

// Actualizar wallet para retiro
router.post("/disableWallet/:id", updateWithdrawalWallet);

module.exports = router;