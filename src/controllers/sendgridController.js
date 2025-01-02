const sgMail = require("@sendgrid/mail");

// Configurar la API Key de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Template de bienvenida con SendGrid
const sendWelcome = async (req, res) => {
  try {
    const { toEmail, name } = req.body; // Parámetros del cuerpo

    // Validar parámetros
    if (!toEmail || !name) {
      return res
        .status(400)
        .json({ error: "Faltan parámetros en el cuerpo de la solicitud." });
    }

    const msg = {
      to: toEmail,
      from: "admin+friends@steamhub.com.mx", // Email autorizado en SendGrid
      templateId: "d-a72486c2321a4d6b980cd4b621fc0553", // Template ID válido
      dynamic_template_data: {
        name, 
      },
    };

    // Enviar correo
    await sgMail.send(msg);
    res.status(200).json({ message: "Correo enviado exitosamente." });
  } catch (error) {
    console.error("Error al enviar el correo:", error.response?.body?.errors || error.message);
    res.status(500).json({ error: "Hubo un error al enviar el correo." });
  }
};

module.exports = { sendWelcome };
