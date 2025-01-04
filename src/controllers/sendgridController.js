const crypto = require("crypto");
const User = require("../models/userModel");
const sgMail = require("@sendgrid/mail");
const Notification = require("../models/notificationModel");

// Configurar la API Key de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Register
const sendUserRegistrationEmail = async (toEmail, userName) => {
  const msg = {
    to: toEmail,
    from: "admin+friends@steamhub.com.mx", // Correo autorizado
    templateId: "d-a72486c2321a4d6b980cd4b621fc0553",
    dynamic_template_data: {
      user_name: userName,
      registration_date: new Date().toISOString().split("T")[0],
    },
  };

  await sgMail.send(msg);
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
      from: "admin+friends@steamhub.com.mx",
      templateId: "d-a31c9812c2404a8085cb6c078caeaaaa",
      dynamic_template_data: {
        user_email: userEmail,
        whitelist_date: new Date().toISOString().split("T")[0],
      },
    };

    // Enviar correo
    await sgMail.send(msg);

    // Crear una notificación en la base de datos
    const notification = new Notification({
      email: toEmail,
      message: `Email: ${toEmail} añadido a la WhiteList`,
      amount: null,
    });

    await notification.save();

    res.status(200).json({ message: "Email sent successfully and notification saved." });
  } catch (error) {
    console.error("Error sending email: ", error);
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
      from: "admin+friends@steamhub.com.mx",
      templateId: "d-cbc2dfa545a847c09e67d1c5b8288b7a",
      dynamic_template_data: {
        user_name: user.name,
        reset_link: resetLink,
      },
    };

    await sgMail.send(msg);

    // Crear una notificación en la base de datos
    const notification = new Notification({
      email: email,
      message: `El usuario: ${user.name} solicito cambio de contraseña`,
      amount: null,
    });

    await notification.save();

    res.status(200).json({ message: "Correo de restablecimiento enviado con éxito." });
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error.message);
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
      from: "admin+friends@steamhub.com.mx",
      templateId: "d-d6e7c8f65f5c48e895cc2a026798f62f",
      dynamic_template_data: {
        email: toEmail,
        update_date: new Date().toISOString().split("T")[0],
      },
    };

    await sgMail.send(msg);

    // Guardar la notificación en la base de datos
    const notification = new Notification({
      email: toEmail,
      message: `Confirmacion de cambio de contraseña al correo ${toEmail}`,
      amount: null, // O puedes eliminar este campo si no aplica
    });

    await notification.save();

    res.status(200).json({ message: "Password confirmation email sent and notification saved." });
  } catch (error) {
    console.error("Error sending password confirmation email: ", error);
    res.status(500).json({ message: "Error sending confirmation email." });
  }
};

// Pull
const sendPulllPaymentEmail = async (toEmail, userName, amount) => {
  const msg = {
    to: toEmail,
    from: "admin+friends@steamhub.com.mx",
    templateId: "d-517f77e6daf445a796e37b98a4316794", 
    dynamic_template_data: {
      user_name: userName,
      payment_date: new Date().toISOString().split("T")[0],
      amount,
    },
  };

  await sgMail.send(msg);
};

// Commissions
const sendCommissionPaymentEmail = async (toEmail, userName, commissionAmount) => {
  const msg = {
    to: toEmail,
    from: "admin+friends@steamhub.com.mx",
    templateId: "d-160f146d203d46658d9f2fc03b2a1f8b", 
    dynamic_template_data: {
      user_name: userName,
      commission_date: new Date().toISOString().split("T")[0],
      commission_amount: commissionAmount,
    },
  };

  await sgMail.send(msg);
};

//Saving
const sendSavingsCreationEmail = async (toEmail, userName, savingsName) => {
  const msg = {
    to: toEmail,
    from: "admin+friends@steamhub.com.mx",
    templateId: "d-7225783fdc954bc799c276271400bac4", 
    dynamic_template_data: {
      user_name: userName,
      savings_name: savingsName,
      savings_date: new Date().toISOString().split("T")[0],
    },
  };

  await sgMail.send(msg);
};

// Affiliate
const sendNewAffiliateEmail = async (toEmail, userName, affiliateName) => {
  const msg = {
    to: toEmail,
    from: "admin+friends@steamhub.com.mx",
    templateId: "d-70b346a15c604fb1b56549abbf938033", 
    dynamic_template_data: {
      user_name: userName,
      affiliate_name: affiliateName,
      affiliate_date: new Date().toISOString().split("T")[0],
    },
  };

  await sgMail.send(msg);
};

module.exports = {
  sendUserRegistrationEmail,
  sendWhitelistActivationEmail,
  sendPasswordResetRequestEmail,
  sendPasswordChangeConfirmationEmail,
  sendPulllPaymentEmail,
  sendCommissionPaymentEmail,
  sendSavingsCreationEmail,
  sendNewAffiliateEmail,
};
