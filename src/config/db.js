const mongoose = require("mongoose");

let isConnected;

const connectDB = async () => {
  if (isConnected) {
    // console.log("Ya conectado a MongoDB.");
    return;
  }

  try {
    // console.log("Iniciando conexión a MongoDB...");
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    // console.log("Conectado a MongoDB con éxito.");
  } catch (error) {
    // console.error("Error al conectar a MongoDB:", error.message);
    throw new Error("No se pudo conectar a la base de datos.");
  }
};

module.exports = connectDB;