const express = require("express");
const { sendUserRegistrationEmail,
    sendWhitelistActivationEmail,
    sendPasswordResetRequestEmail,
    sendPasswordChangeConfirmationEmail,
    sendPullPaymentEmail,
    sendCommissionPaymentEmail,
    sendSavingsCreationEmail,
    sendNewAffiliateEmail, } = require("../controllers/sendgridController");

const router = express.Router();

// Ruta para enviar el correo de register
router.post("/register", sendUserRegistrationEmail);

// Ruta para enviar el correo de whitelist
router.post("/whitelist", sendWhitelistActivationEmail);

// Ruta para enviar el correo de resetPassword
router.post("/resetPassword", sendPasswordResetRequestEmail);

// Ruta para enviar el correo de passwordConfirmation
router.post("/passwordConfirmation", sendPasswordChangeConfirmationEmail);

// Ruta para enviar el correo de pull
router.post("/pull", sendPullPaymentEmail);

// Ruta para enviar el correo de comission
router.post("/comission", sendCommissionPaymentEmail);

// Ruta para enviar el correo de savings
router.post("/saving", sendSavingsCreationEmail);

// Ruta para enviar el correo de savings
router.post("/newAffiliate", sendNewAffiliateEmail);

module.exports = router;
