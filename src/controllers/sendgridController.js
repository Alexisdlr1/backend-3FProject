const sgMail = require("@sendgrid/mail");

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

    await sgMail.send(msg);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email: ", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

// Reset Password
const sendPasswordResetRequestEmail = async (toEmail, userName, resetLink) => {
  const msg = {
    to: toEmail,
    from: "admin+friends@steamhub.com.mx",
    templateId: "TEMPLATE_ID_RESET_SOLICITUD", 
    dynamic_template_data: {
      user_name: userName,
      reset_link: resetLink,
    },
  };

  await sgMail.send(msg);
};

// Password Change
const sendPasswordChangeConfirmationEmail = async (toEmail, userName) => {
  const msg = {
    to: toEmail,
    from: "admin+friends@steamhub.com.mx",
    templateId: "d-d6e7c8f65f5c48e895cc2a026798f62f", 
    dynamic_template_data: {
      user_name: userName,
      update_date: new Date().toISOString().split("T")[0],
    },
  };

  await sgMail.send(msg);
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
