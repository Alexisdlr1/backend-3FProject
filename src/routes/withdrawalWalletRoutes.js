const express = require("express");
const { addWithdrawWallet, updateWithdrawalWallet, deleteWithdrawalWallet } = require("../controllers/withdrawalWalletController");

const router = express.Router();

// Agregar wallet secundaria
router.post("/add/:id", addWithdrawWallet);

// Eliminar wallet secundaria
router.get("/delete/:id", deleteWithdrawalWallet);

// Actualizar wallet secundaria
router.put("/update/:id", updateWithdrawalWallet);


module.exports = router;