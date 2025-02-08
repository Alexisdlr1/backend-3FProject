const WhiteList = require("../models/whiteListModel");
const mongoose = require("mongoose");
const User = require("../models/userModel");

// Obtener todos los usuarios de la whitelist
const getWhiteListUsers = async (req, res) => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
    const limit = parseInt(req.query.limit) || 10; // Usuarios por página (por defecto 10)
    const skip = (page - 1) * limit; // Usuarios a saltar

    // Consultar usuarios con paginación
    const users = await WhiteList.find()
      .skip(skip)
      .limit(limit)
      .select("email isApproved");

    // Obtener el total de usuarios para la respuesta
    const totalUsers = await WhiteList.countDocuments();

    res.status(200).json({
      total: totalUsers,
      page,
      pages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    // console.error("Error en getWhiteListUsers:", error.message);
    res.status(500).json({ message: "Error al obtener usuarios.", error: error.message });
  }
};

// Crear un nuevo usuario en la lista blanca
const createWhiteListUser = async (req, res) => {
  try {
    const { email, isApproved } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    // Verificar si el email ya existe en la colección de WhiteList
    const existingUserInWhiteList = await WhiteList.findOne({ email });

    if (existingUserInWhiteList) {
      if (!existingUserInWhiteList.isApproved) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // Hace 24 horas

        if (existingUserInWhiteList.createdAt < oneDayAgo) {
          return res.status(400).json({ message: "El email fue rechazado." });
        }

        return res.status(400).json({
          message: "El email ya está registrado en espera de aprobación.",
        });
      }

      // Si el email ya está aprobado, verificar si tiene una cuenta en User
      const existingUserInUserCollection = await User.findOne({ email });

      if (existingUserInUserCollection) {
        // Si ya existe una cuenta, redirigir al login
        return res.status(409).json({
          message: "El email ya está registrado y aprobado.",
          redirect: "/login",
        });
      }

      // Si no existe una cuenta en User, redirigir al registro
      return res.status(409).json({
        message: "El email está aprobado, pero no tiene una cuenta. Redirigiendo al registro.",
        redirect: "/register",
      });
    }

    // Crear un nuevo usuario en la lista blanca si no existe
    const user = new WhiteList({
      email,
      isApproved,
    });

    await user.save();

    res.status(201).json({ message: "Usuario creado con éxito.", user });
  } catch (error) {
    // console.error("Error en createWhiteListUser:", error.message);
    res
      .status(500)
      .json({ message: "Error al crear usuario.", error: error.message });
  }
};

// Actualizar un campo específico de un usuario por id
const updateWhiteListUser = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario a actualizar
    const updateData = req.body; // Datos a actualizar

    // Validar el formato del ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    // Verificar que `updateData` no esté vacío
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Datos de actualización requeridos." });
    }

    // Buscar y actualizar el usuario
    const updatedUser = await WhiteList.findByIdAndUpdate(id, updateData, {
      new: true, // Devuelve el documento actualizado
      runValidators: true, // Ejecuta las validaciones del esquema
    });

    // Verificar si el usuario fue encontrado
    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Usuario actualizado con éxito.", user: updatedUser });
  } catch (error) {
    // console.error("Error en updateWhiteListUser:", error.message);
    res.status(500).json({ message: "Error al actualizar el usuario.", error: error.message });
  }
};

// Eliminar un usuario por ID
const deleteWhiteListUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar el formato del ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    // Buscar y eliminar el usuario
    const deletedUser = await WhiteList.findByIdAndDelete(id);

    // Verificar si el usuario fue encontrado y eliminado
    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Usuario eliminado con éxito.", user: deletedUser });
  } catch (error) {
    // console.error("Error en deleteWhiteListUser:", error.message);
    res.status(500).json({ message: "Error al eliminar el usuario.", error: error.message });
  }
};

module.exports = { createWhiteListUser, getWhiteListUsers, updateWhiteListUser, deleteWhiteListUser };
