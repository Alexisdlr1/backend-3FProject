const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    console.log("Iniciando getAllUsers...");

    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
    const limit = parseInt(req.query.limit) || 10; // Usuarios por página (por defecto 10)
    const skip = (page - 1) * limit; // Usuarios a saltar

    // Consultar usuarios con paginación
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .select("name email isAdmin isActive");

    // Obtener el total de usuarios para la respuesta
    const totalUsers = await User.countDocuments();

    console.log(`Usuarios encontrados: ${users.length}`);
    res.status(200).json({
      total: totalUsers,
      page,
      pages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    console.error("Error en getAllUsers:", error.message);
    res.status(500).json({ message: "Error al obtener usuarios.", error: error.message });
  }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
  try {
    console.log("Iniciando getUserById...");

    const userId = req.params.id;

    const user = await User.findById(userId).select("name email isAdmin isActive wallet referrals uplineCommisions name_beneficiary email_beneficiary withdrawalWallet");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    console.log(`Usuario encontrado: ${user.name}`);
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error en getUserById:", error.message);
    res.status(500).json({ message: "Error al obtener el usuario.", error: error.message });
  }
};

// Login usuario con JWT (Nuevo)
const loginUser = async (req, res) => {
  try {
    const { email, password, wallet } = req.body;

    if (!email && !wallet) {
      return res.status(400).json({ message: "Por favor, ingresa al menos la wallet o las credenciales de usuario." });
    }

    let user;
    // Si hay wallet, buscar al usuario por la wallet
    if (wallet) {
      user = await User.findOne({ wallet });
      if (!user) {
        return res.status(401).json({ message: "Wallet no registrada." });
      }
    }

    // Si hay email y contraseña, buscar al usuario por email
    if (email && password) {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas." });
      }

      // Verificar la contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // Incrementar el contador de intentos fallidos
        user.failedAttempts += 1;

        // Bloquear si se exceden los intentos permitidos
        if (user.failedAttempts >= 6) {
          user.lockUntil = Date.now() + 15 * 60 * 1000; // Bloqueo por 15 minutos
          user.failedAttempts = 0; // Reiniciar el contador
          await user.save();
          return res.status(423).json({
            message: "Cuenta bloqueada por múltiples intentos fallidos. Inténtalo después de 15 minutos.",
          });
        }

        await user.save();
        return res.status(401).json({ message: "Credenciales inválidas." });
      }

      // Restablecer el contador de intentos fallidos y el bloqueo
      user.failedAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Validar que la wallet coincida (en caso de login con wallet)
    if (wallet && user.wallet !== wallet) {
      return res.status(401).json({ message: "La wallet proporcionada no coincide con la registrada." });
    }

    // Generar el token JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        wallet: user.wallet,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        ReferersCommissions: user.uplineCommisions,
        email_beneficiary: user.email_beneficiary,
        name_beneficiary: user.name_beneficiary,
        balance: user.totalBalance,
        referrals: user.referrals,
        membership: user.membership,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        wallet: user.wallet,
        ReferersCommissions: user.uplineCommisions,
        email_beneficiary: user.email_beneficiary,
        name_beneficiary: user.name_beneficiary,
        membership: user.membership,
      },
    });
  } catch (error) {
    console.error("Error en login:", error.message);
    res.status(500).json({ message: "Error en el servidor.", error: error.message });
  }
};

// Crear un usuario
const createUser = async (req, res) => {
  try {
    const { name, email, password, referredBy, wallet, isAdmin, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado." });
    }

    // Verificar si la wallet de referido existe
    let referrer = null;
    if (referredBy) {
      referrer = await User.findOne({ wallet: referredBy });
      if (!referrer) {
        return res.status(400).json({ message: "La wallet de referido no está registrada." });
      }
    }

    // Encriptar la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);

    // Construir el árbol de referencias (uplineCommisions)
    const uplineCommisions = [];
    let currentReferrer = referrer; // Empieza con el referido inmediato
    for (let i = 0; i < 3; i++) { // 3 niveles
      if (!currentReferrer) break;
      uplineCommisions.push(currentReferrer.wallet); // Agrega el nivel más cercano al final del arreglo
      currentReferrer = await User.findOne({ wallet: currentReferrer.referred_by }); // Busca el siguiente nivel
    }

    const user = new User({
      name,
      email,
      password: hashedPassword, // Guardar la contraseña encriptada
      referred_by: referredBy,
      wallet,
      isAdmin,
      isActive,
      uplineCommisions, // Agregar el árbol de referencias
    });

    // Guardar el nuevo usuario
    await user.save();

    // Si hay referido, agregar la wallet del nuevo usuario al arreglo de referrals
    if (referrer) {
      referrer.referrals.push(wallet);
      await referrer.save(); // Guardar los cambios del referido
    }

    res.status(201).json({ message: "Usuario creado con éxito.", user });
  } catch (error) {
    console.error("Error al crear usuario:", error.message);
    res.status(500).json({ message: "Error al crear usuario.", error: error.message });
  }
};

// Obtener informacion de los referidos
const getReferersCommissions = async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      console.log("Error: La wallet es obligatoria.");
      return res.status(400).json({ message: "La wallet es obligatoria." });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ wallet });
    if (!user) {
      console.log(`Usuario no encontrado para la wallet: ${wallet}`);
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const ReferersCommissionsResponse = [];
    const visitedWallets = new Set(); // Para evitar ciclos o duplicados

    // Inicializar el primer nivel
    let currentLevel = await User.find({ wallet: { $in: user.referrals } }).then(referrals =>
      referrals.map(ref => ({
        ...ref.toObject(),
        parentWallet: wallet, // Relación con el usuario principal
      }))
    );

    for (let level = 1; level <= 7; level++) {
      if (currentLevel.length === 0) break;

      // Agregar el nivel actual al resultado
      ReferersCommissionsResponse.push({
        level,
        referrals: currentLevel.map(referral => ({
          wallet: referral.wallet,
          name: referral.name || "No disponible",
          email: referral.email || "No disponible",
          parentWallet: referral.parentWallet, // Relación con el nivel anterior
        })),
      });

      // Marcar las wallets visitadas
      currentLevel.forEach(ref => visitedWallets.add(ref.wallet));

      // Obtener los referidos del siguiente nivel
      const nextLevelWallets = currentLevel
        .flatMap(ref => ref.referrals || [])
        .filter(wallet => !visitedWallets.has(wallet));

      currentLevel = await User.find({ wallet: { $in: nextLevelWallets } }).then(referrals =>
        referrals.map(ref => ({
          ...ref.toObject(),
          parentWallet: currentLevel.find(curr => curr.referrals.includes(ref.wallet))?.wallet || null,
        }))
      );
    }

    res.status(200).json({
      message: "Referidos obtenidos con éxito.",
      ReferersCommissions: ReferersCommissionsResponse,
    });
  } catch (error) {
    console.error("Error al obtener referrals:", error.message);
    res.status(500).json({
      message: "Error al obtener referrals.",
      error: error.message,
    });
  }
};

// Verificar si una wallet ya existe
const checkWallet = async (req, res) => {
  try {
    const { wallet } = req.body;
    console.log("the wallet: ", wallet); // test

    // Validar que se proporcionó una wallet
    if (!wallet) {
      return res.status(400).json({ message: "La dirección de wallet es requerida." });
    }

    // Buscar si ya existe un usuario con la misma wallet
    const existingUser = await User.findOne({ wallet });

    if (existingUser) {
      return res.status(200).json({ exists: true, message: "La wallet ya está registrada." });
    }

    res.status(200).json({ exists: false, message: "La wallet no está registrada." });
  } catch (error) {
    res.status(500).json({ message: "Error al verificar la wallet.", error: error.message });
  }
};

// Actualizar datos del usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "ID o datos de actualización faltantes." });
    }

    // Validar el formato del ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Usuario actualizado con éxito.", user: updatedUser });
  } catch (error) {
    console.error("Error en updateUser:", error.message);
    res.status(500).json({ message: "Error al actualizar el usuario.", error: error.message });
  }
};

// Actualizar password
const resetPassword = async (req, res) => {
  console.log("Intentando resetear contraseña...");
  try {
    const { token, email, newPassword } = req.body; // Incluye el token en el body

    console.log("Datos recibidos:", { email, token });

    // Verificar que los campos obligatorios estén presentes
    if (!token || !email || !newPassword) {
      console.log("Faltan datos obligatorios para resetear la contraseña.");
      return res.status(400).json({ message: "Por favor, ingresa todos los campos." });
    }

    // Buscar al usuario por el token de restablecimiento y verificar si ha expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      console.log("Token inválido o expirado.");
      return res.status(400).json({ message: "Token inválido o expirado." });
    }

    // Validar formato de la nueva contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("La contraseña no cumple con los requisitos.");
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un carácter especial.",
      });
    }

    // Validar que la nueva contraseña no sea la misma que la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      console.log("La nueva contraseña no puede ser igual a la anterior.");
      return res.status(400).json({ message: "La nueva contraseña no puede ser igual a la anterior." });
    }

    // Encriptar la nueva contraseña
    console.log("Encriptando nueva contraseña...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña en la base de datos
    user.password = hashedPassword;
    user.resetPasswordToken = undefined; // Eliminar el token de restablecimiento
    user.resetPasswordExpires = undefined; // Eliminar la expiración del token
    await user.save();

    console.log("Contraseña actualizada exitosamente.");
    res.status(200).json({ message: "Contraseña restablecida exitosamente." });
  } catch (error) {
    console.error("Error en resetPassword:", error.message);
    res.status(500).json({ message: "Error en el servidor.", error: error.message });
  }
};

// Función para obtener las notificaciones por email usando POST
const getNotificationsBySingleEmail = async (req, res) => {
  try {
    console.log("Iniciando getNotificationsBySingleEmail...");

    const { email } = req.body;  // Usar body en lugar de query
    if (!email) {
      return res.status(400).json({ error: "El parámetro 'email' es obligatorio." });
    }

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(`Buscando notificaciones para el email: ${email}, page: ${page}, limit: ${limit}`);

    const notifications = await Notification.find({ email })
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const totalNotifications = await Notification.countDocuments({ email });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ error: "No se encontraron notificaciones para este email." });
    }

    console.log(`Notificaciones encontradas: ${notifications.length}`);
    res.status(200).json({
      total: totalNotifications,
      page,
      pages: Math.ceil(totalNotifications / limit),
      email,
      notifications,
    });
  } catch (error) {
    console.error("Error en getNotificationsBySingleEmail:", error);
    res.status(500).json({
      message: "Error al obtener notificaciones para el email.",
      error: error.message,  // Incluye más detalles del error
    });
  }
};

module.exports = { 
  createUser,
  getAllUsers,
  loginUser,
  checkWallet,
  updateUser,
  getUserById,
  getReferersCommissions,
  resetPassword,
  getNotificationsBySingleEmail
};