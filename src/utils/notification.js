const NOTIFICATION_TYPES = Object.freeze({
  REGISTRATION: "REGISTRATION",
  WHITELIST: "WHITELIST",
  RESET_PASSWORD: "RESET PASSWORD",
  CHANGE_PASSWORD: "CHANGE PASSWORD",
  PULL_PAYMENT: "PULL PAYMENT",
  NEW_SAVING: "NEW SAVING",
  COMMISSION_PAYMENT: "COMMISSION PAYMENT",
  NEW_AFFILIATE: "NEW AFFILIATE",
})

const MESSAGE_UI = Object.freeze({
  REGISTRATION: "¡Te has registrado exitosamente, Bienvenido!",
  WHITELIST: "Tu email se ha aprobado en Friends and Family.",
  RESET_PASSWORD: "Has solicitado un cambio de contraseña.",
  CHANGE_PASSWORD: "Tu contraseña se ha actualizado exitosamente.",
  PULL_PAYMENT: "Has recibido un nuevo pago del pull.",
  NEW_SAVING: "¡Has iniciado un nuevo ahorro, sigue así!",
  COMMISSION_PAYMENT: "¡Has recibido una nueva comisión, Felicidades!",
})

module.exports = { NOTIFICATION_TYPES, MESSAGE_UI };