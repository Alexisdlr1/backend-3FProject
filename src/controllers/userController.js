const User = require("../models/userModel");
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

        const user = await User.findById(userId).select("name email isAdmin isActive wallet referrals uplineCommisions");

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
        uplineCommisions.unshift(currentReferrer.wallet); // Agrega el nivel más cercano al inicio del arreglo
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

  const checkUserWallet = async (req, res) => {
    try {
        const { wallet, id } = req.body;

        // Validar que se proporcionó una wallet
        if (!wallet) {
            return res.status(400).json({ message: "La dirección de wallet es requerida." });
        }

        // Buscar si ya existe un usuario con la misma wallet
        const user = await User.findOne({ id });
        if (!user) {
            return res.status(401).json({message: "Usuario no encontrado." });
        }

        if (user.wallet !== wallet) {
          return res.status(401).json({ message: "La wallet proporcionada no coincide con la registrada." });
        }

        res.status(200).json({ exists: false, message: "La wallet pretenece al usuario." });
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

// Resetear contraseña
const resetPassword = async (req, res) => {
  console.log("Intentando resetear contraseña...");
  try {
    const { email, wallet, newPassword } = req.body;
    console.log("Datos recibidos:", { email, wallet });

    // Verificar que los campos obligatorios estén presentes
    if (!email || !wallet || !newPassword) {
      console.log("Faltan datos obligatorios para resetear la contraseña.");
      return res.status(400).json({ message: "Por favor, ingresa todos los campos." });
    }

    // Buscar al usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Usuario no encontrado.");
      return res.status(404).json({ message: "El usuario no existe." });
    }

    // Validar que la wallet proporcionada coincida con la registrada en la base de datos
    if (user.wallet !== wallet) {
      console.log("La wallet proporcionada no coincide.");
      return res.status(401).json({ message: "La wallet proporcionada no coincide con la registrada." });
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
    await user.save();

    console.log("Contraseña actualizada exitosamente.");
    res.status(200).json({ message: "Contraseña restablecida exitosamente." });
  } catch (error) {
    console.error("Error en resetPassword:", error.message);
    res.status(500).json({ message: "Error en el servidor.", error: error.message });
  }
};

module.exports = { createUser, getAllUsers, loginUser, checkWallet, updateUser, getUserById, getReferersCommissions, resetPassword };