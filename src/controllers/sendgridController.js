const crypto = require("crypto");
const User = require("../models/userModel");
const sgMail = require("@sendgrid/mail");
const Notification = require("../models/notificationModel");
const { getCommissionsPerSaving } = require("../business/commission");
const { 
  createRegistrationNotification,
  createWhitelistNotification,
  createPasswordResetNotification,
  createChangePasswordNotification,
  createPullPaymentNotification,
  createCommissionNotification,
  createNewSavingNotification,
} = require("../utils/notification")

// Parche para comisiones
const MEMBERSHIP_COMMISSION = Object.freeze({
  TO_BUSSINESS: 400,
  TO_UPLINE: 100,
})

const SENDGRID_MAIL = "notificaciones@freefriendsandfamily.vip"

// Configurar la API Key de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Register
const sendUserRegistrationEmail = async (req, res) => {
  const { toEmail, userName } = req.body;

  if (!toEmail || !userName) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const msg = {
      to: toEmail,
      from: SENDGRID_MAIL,
      templateId: "d-a72486c2321a4d6b980cd4b621fc0553",
      dynamic_template_data: {
        user_name: userName,
        register_date: new Date().toISOString().split("T")[0],
      },
    };

    // Enviar correo
    await sgMail.send(msg);

    // Crear una notificación en la base de datos
    await createRegistrationNotification(toEmail);

    res.status(200).json({ message: "Email sent successfully and notification saved." });
  } catch (error) {
    // console.error("Error sending email: ", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

// WhiteList
const sendWhitelistActivationEmail = async (req, res) => {
  const { toEmail, userEmail } = req.body;

  if (!toEmail || !userEmail) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const msg = {
      to: toEmail,
      from: SENDGRID_MAIL,
      templateId: "d-a31c9812c2404a8085cb6c078caeaaaa",
      dynamic_template_data: {
        user_email: userEmail,
        whitelist_date: new Date().toISOString().split("T")[0],
      },
    };

    // Enviar correo
    await sgMail.send(msg);

    // Crear una notificación en la base de datos
    await createWhitelistNotification(toEmail);

    res.status(200).json({ message: "Email sent successfully and notification saved." });
  } catch (error) {
    // console.error("Error sending email: ", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

// Reset Password
const sendPasswordResetRequestEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el email existe en la base de datos
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "El correo no está registrado." });
    }

    // Generar un token único y su expiración
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora

    // Guardar el token y su expiración en el usuario
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Crear el enlace para restablecer la contraseña con parámetro en la URL
    const resetLink = `${process.env.CLIENT_URL}/resetPassword?email=${encodeURIComponent(user.email)}&token=${resetToken}`;

    // Enviar correo con el enlace
    const msg = {
      to: email,
      from: SENDGRID_MAIL,
      templateId: "d-cbc2dfa545a847c09e67d1c5b8288b7a",
      dynamic_template_data: {
        user_name: user.name,
        reset_link: resetLink,
      },
    };

    await sgMail.send(msg);

    // Crear una notificación en la base de datos
    await createPasswordResetNotification(email, user.name);

    res.status(200).json({ message: "Correo de restablecimiento enviado con éxito." });
  } catch (error) {
    // console.error("Error al solicitar restablecimiento:", error.message);
    res.status(500).json({ message: "Error al solicitar restablecimiento de contraseña." });
  }
};

// Password Change
const sendPasswordChangeConfirmationEmail = async (req, res) => {
  const { toEmail } = req.body;

  if (!toEmail) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Configurar y enviar el correo
    const msg = {
      to: toEmail,
      from: SENDGRID_MAIL,
      templateId: "d-d6e7c8f65f5c48e895cc2a026798f62f",
      dynamic_template_data: {
        email: toEmail,
        update_date: new Date().toISOString().split("T")[0],
      },
    };

    await sgMail.send(msg);

    // Guardar la notificación en la base de datos
    await createChangePasswordNotification(toEmail);

    res.status(200).json({ message: "Password confirmation email sent and notification saved." });
  } catch (error) {
    // console.error("Error sending password confirmation email: ", error);
    res.status(500).json({ message: "Error sending confirmation email." });
  }
};

// Pull
const sendPullPaymentEmail = async (req, res) => {
  const { toEmail, userName, amount } = req.body;

  if (!toEmail || !userName || !amount) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const msg = {
      to: toEmail,
      from: SENDGRID_MAIL,
      templateId: "d-517f77e6daf445a796e37b98a4316794",
      dynamic_template_data: {
        user_name: userName,
        payment_date: new Date().toISOString().split("T")[0],
        amount,
      },
    };

    await sgMail.send(msg);

    // Save the notification event in DB
    await createPullPaymentNotification(toEmail, amount);

    res.status(200).json({ message: "Pull payment email sent and notification saved." });
  } catch (error) {
    // console.error("Error sending pull payment email: ", e);
    res.status(500).json({ message: "Error sending pull payment email." });
  }


};

// Commissions
const sendCommissionPaymentEmail = async (req, res) => {
  const { wallet, commissionAmount } = req.body;

  if (!wallet || !commissionAmount) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const user = await User.findOne({ wallet });
    if (!user) {
      return res.status(404).json({ message: "El correo no está registrado." });
    }

    const toEmail = user.email;
    const userName = user.name;

    // Email settings
    const msg = {
      to: toEmail,
      from: SENDGRID_MAIL,
      templateId: "d-160f146d203d46658d9f2fc03b2a1f8b",
      dynamic_template_data: {
        user_name: userName,
        commission_date: new Date().toISOString().split("T")[0],
        commission_amount: commissionAmount,
      },
    };

    await sgMail.send(msg);

    // Save the notification event in DB
    await createCommissionNotification(toEmail, commissionAmount);

    res.status(200).json({ message: "Commission payment email sent and notification saved." });
  } catch (e) {
    // console.error("Error sending commission payment email: ", e);
    res.status(500).json({ message: "Error sending commission payment email." });
  }
};

//Saving
const sendSavingsCreationEmail = async (req, res) => {
  const { userId, amount, isFirstSaving } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const walletUplines = user.uplineCommisions;
    const userEmail = user.email;
    const commissions = getCommissionsPerSaving(amount);

    // COMMISION FOR FIRST UPLINE
    if (walletUplines[0] && isFirstSaving) {
      patchCommisionPaymentEmail(walletUplines[0], MEMBERSHIP_COMMISSION.TO_UPLINE);
    }

    // Enviar correo para notificar nuevo ahorro
    const msg = {
      to: userEmail,
      from: SENDGRID_MAIL,
      templateId: "d-7225783fdc954bc799c276271400bac4",
      dynamic_template_data: {
        email: userEmail,
        amount: amount,
        creation_date: new Date().toISOString().split("T")[0],
      },
    };

    await sgMail.send(msg);

    // Parche para envio de correos
    for (let i = 0; i < 3; i++) {
      if (!walletUplines[i]) break;
      await patchCommisionPaymentEmail(walletUplines[i], commissions[i])
    }
    

    res.status(200).json({ message: "Saving email sent." });
  } catch (error) {
    // console.error("Error sending saving email: ", error);
    res.status(500).json({ message: "Error sending saving email." });
  }
};

// Solucion para envio de email y notificaciones 
const patchCommisionPaymentEmail = async (wallet, commissionAmount) => {
  try {
    const user = await User.findOne({ wallet });
    if (!user) return;

    const toEmail = user.email;
    const userName = user.name;

    // Email settings
    const msg = {
      to: toEmail,
      from: SENDGRID_MAIL,
      templateId: "d-160f146d203d46658d9f2fc03b2a1f8b",
      dynamic_template_data: {
        user_name: userName,
        commission_date: new Date().toISOString().split("T")[0],
        commission_amount: commissionAmount,
      },
    };

    await sgMail.send(msg);

  } catch (e) {
    // console.error("Error sending commission payment email: ", e);
  }
};

// Affiliate
const sendNewAffiliateEmail = async (req, res) => {
  const { referredBy, affiliateName, affiliateEmail } = req.body;

  if (!referredBy || !affiliateName) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Verificar si la wallet de referido existe y obtener su nombre
  let toEmail = null;
  let userName = null;
  if (referredBy) {
    const referrer = await User.findOne({ wallet: referredBy });
    if (!referrer) {
      return res.status(400).json({ message: "La wallet de referido no está registrada." });
    }
    toEmail = referrer.email; // Obtener el email del referido
    userName = referrer.name // Obtener el name del referido
  }

  try {
    const msg = {
      to: toEmail,
      from: SENDGRID_MAIL,
      templateId: "d-70b346a15c604fb1b56549abbf938033",
      dynamic_template_data: {
        user_name: userName,
        affiliate_name: affiliateName,
        affiliate_date: new Date().toISOString().split("T")[0],
      },
    };

    // Enviar correo
    await sgMail.send(msg);

    const notification = new Notification({
      type: NOTIFICATION_TYPES.NEW_AFFILIATE,
      email: toEmail,
      message: `${affiliateEmail} es un afiliado directo de ${toEmail}`,
      message_ui: `${affiliateName} es ahora afiliado tuyo`,
      amount: null,
    });

    await notification.save();

    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    // console.error("Error sending email: ", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

module.exports = {
  sendUserRegistrationEmail,
  sendWhitelistActivationEmail,
  sendPasswordResetRequestEmail,
  sendPasswordChangeConfirmationEmail,
  sendPullPaymentEmail,
  sendCommissionPaymentEmail,
  sendSavingsCreationEmail,
  sendNewAffiliateEmail,
};
