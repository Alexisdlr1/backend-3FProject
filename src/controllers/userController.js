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

  // Login usuario con JWT
  const loginUser = async (req, res) => {
    console.log("Intentando iniciar sesión...");
    try {
      const { email, password, wallet } = req.body;
      console.log("Datos recibidos:", { email, wallet });

      // Verificar que los campos obligatorios estén presentes
      if (!email || !password || !wallet) {
        console.log("Faltan datos obligatorios para el login.");
        return res.status(400).json({ message: "Por favor, ingresa todos los campos." });
      }

      // Buscar al usuario por email
      const user = await User.findOne({ email });
      if (!user) {
        console.log("Usuario no encontrado.");
        return res.status(401).json({ message: "Credenciales inválidas." });
      }

      // Verificar la contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Contraseña incorrecta.");
        return res.status(401).json({ message: "Credenciales inválidas." });
      }

      // Validar que la wallet proporcionada coincida con la registrada en la base de datos
      if (user.wallet !== wallet) {
        console.log("La wallet proporcionada no coincide.");
        return res.status(401).json({ message: "La wallet proporcionada no coincide con la registrada." });
      }

      // Generar el token JWT
      console.log("Generando token JWT...");
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          name: user.name,
          wallet: user.wallet,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          uplineCommissions: user.uplineCommisions,
          email_beneficiary: user.email_beneficiary,
          name_beneficiary: user.name_beneficiary,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log("Inicio de sesión exitoso.");
      res.status(200).json({
        message: "Inicio de sesión exitoso.",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          wallet: user.wallet,
          uplineCommissions: user.uplineCommisions,
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

        // Construir el árbol de referencias (uplineCommissions)
        const uplineCommissions = [];
        let currentReferrer = referrer; // Empieza con el referido inmediato
        for (let i = 0; i < 3; i++) {
            if (!currentReferrer) break;
            uplineCommissions.unshift(currentReferrer.wallet); // Agrega el nivel más cercano al inicio del arreglo
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
            uplineCommisions: uplineCommissions, // Agregar el árbol de referencias
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

module.exports = { createUser, getAllUsers, loginUser, checkWallet, updateUser, getUserById };