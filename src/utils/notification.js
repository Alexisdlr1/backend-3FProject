const Notification = require("../models/notificationModel");

const NOTIFICATION_TYPES = Object.freeze({
  REGISTRATION: "REGISTRATION",
  WHITELIST: "WHITELIST",
  RESET_PASSWORD: "RESET PASSWORD",
  CHANGE_PASSWORD: "CHANGE PASSWORD",
  PULL_PAYMENT: "PULL PAYMENT",
  NEW_SAVING: "NEW SAVING",
  COMMISSION_PAYMENT: "COMMISSION PAYMENT",
  NEW_AFFILIATE: "NEW AFFILIATE",
  MEMBERSHIP_PAYMENT: "MEMBERSHIP PAYMENT"
});

const MESSAGE_UI = Object.freeze({
  REGISTRATION: "¡Te has registrado exitosamente, Bienvenido!",
  WHITELIST: "Tu email se ha aprobado en Friends and Family.",
  RESET_PASSWORD: "Has solicitado un cambio de contraseña.",
  CHANGE_PASSWORD: "Tu contraseña se ha actualizado exitosamente.",
  PULL_PAYMENT: "Has recibido un nuevo pago del pull.",
  NEW_SAVING: "¡Has iniciado un nuevo ahorro, sigue así!",
  COMMISSION_PAYMENT: "¡Has recibido una nueva comisión, Felicidades!",
  MEMBERSHIP_PAYMENT: "!Felicidades, has pagado tu membresia! ",
});

const ERRORS = Object.freeze({
  GENERAL: "Se ha producido un error al crear notificacion",
});

const createRegistrationNotification = async (toEmail) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.REGISTRATION,
      email: toEmail,
      message: `Email: ${toEmail} registrado con exito`,
      message_ui: MESSAGE_UI.REGISTRATION,
      amount: null,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

const createMembershipPaymentNotification = async (toEmail, membershipAmount) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.MEMBERSHIP_PAYMENT,
      email: toEmail,
      message: `Email: ${toEmail} ha pagado su membresia en FREE`,
      message_ui: MESSAGE_UI.MEMBERSHIP_PAYMENT,
      amount: membershipAmount,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

const createWhitelistNotification = async (toEmail) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.WHITELIST,
      email: toEmail,
      message: `Email: ${toEmail} añadido a la WhiteList`,
      message_ui: MESSAGE_UI.WHITELIST,
      amount: null,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

const createPasswordResetNotification = async (toEmail, username) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.RESET_PASSWORD,
      email: toEmail,
      message: `El usuario: ${username} solicito cambio de contraseña`,
      message_ui: MESSAGE_UI.RESET_PASSWORD,
      amount: null,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

const createChangePasswordNotification = async (toEmail) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.CHANGE_PASSWORD,
      email: toEmail,
      message: `Confirmacion de cambio de contraseña al correo ${toEmail}`,
      message_ui: MESSAGE_UI.CHANGE_PASSWORD,
      amount: null,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

const createPullPaymentNotification = async (toEmail, commissionAmount) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.PULL_PAYMENT,
      email: toEmail,
      message: `Nueva comision detectada hacia el usuario: ${toEmail}`,
      message_ui: MESSAGE_UI.PULL_PAYMENT,
      amount: commissionAmount,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

const createCommissionNotification = async (toEmail, commissionAmount) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.COMMISSION_PAYMENT,
      email: toEmail,
      message: `Nueva comision detectada hacia el usuario: ${toEmail}`,
      message_ui: MESSAGE_UI.COMMISSION_PAYMENT,
      amount: commissionAmount,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

const createNewSavingNotification = async (toEmail, savingAmount) => {
  try {
    const notification = new Notification({
      type: NOTIFICATION_TYPES.NEW_SAVING,
      email: toEmail,
      message: `Confirmacion de nuevo ahorro en el correo: ${toEmail}`,
      message_ui: MESSAGE_UI.NEW_SAVING,
      amount: savingAmount,
    });

    await notification.save();
    
    return true;
  } catch (e) {
    console.error(ERRORS.GENERAL, e);
    return false;
  }
}

module.exports = { 
  createRegistrationNotification,
  createWhitelistNotification,
  createPasswordResetNotification,
  createChangePasswordNotification,
  createPullPaymentNotification,
  createCommissionNotification,
  createNewSavingNotification,
  createMembershipPaymentNotification,
};