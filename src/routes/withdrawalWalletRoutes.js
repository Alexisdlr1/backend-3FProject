const express = require("express");
const { addWithdrawWallet, enableWithdrawalWallet, deleteWithdrawalWallet } = require("../controllers/withdrawalWalletController");

const router = express.Router();

// Agregar wallet secundaria
router.post("/add/:id", addWithdrawWallet);

// Eliminar wallet secundaria
router.get("/delete/:id", deleteWithdrawalWallet);

// Actualizar wallet secundaria
router.put("/update/:id", enableWithdrawalWallet);


module.exports = router;