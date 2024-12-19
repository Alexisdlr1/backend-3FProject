require("dotenv").config(); // Cargar variables de entorno
const connectDB = require("./src/config/db");
const app = require("./src/app");
const cors = require("cors"); // Importar cors

// Configuración de CORS
const corsOptions = {
  origin: ["http://localhost:3000", "https://3-f-project-nextjs.vercel.app/"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Conexión a la base de datos
console.log("Iniciando conexión a MongoDB...");
connectDB()
  .then(() => console.log("Conexión a MongoDB exitosa."))
  .catch((err) => console.error("Fallo la conexión a MongoDB:", err.message));

// Habilitar CORS para todas las rutas con la configuración personalizada
console.log("Configurando CORS...");
app.use(cors(corsOptions));

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});