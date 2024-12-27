const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");

// Ruta para obtener las transacciones agrupadas por usuario
const getGroupedTransactions = async (req, res) => {
    try {
      const transactions = await Transaction.aggregate([
        {
          $group: {
            _id: "$userId",
            transactions: { $push: "$$ROOT" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $project: {
            userId: "$_id",
            transactions: 1,
            userDetails: { email: 1 },
          },
        },
      ]);
  
      if (!transactions || transactions.length === 0) {
        return res.status(404).json({ error: "No se encontraron transacciones." });
      }
  
      return res.status(200).json({
        message: "Transacciones agrupadas por usuario obtenidas exitosamente.",
        data: transactions,
      });
    } catch (error) {
      console.error("Error al obtener transacciones agrupadas:", error);
      return res.status(500).json({ error: "Ocurrió un error en el servidor." });
    }
  };

// Controlador para crear una transacción
const createTransaction = async (req, res) => {
  try {
      const { userId, amount, date, hash } = req.body;

      if (!userId || !amount) {
          return res.status(400).json({ error: "userId y amount son requeridos." });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: "Usuario no encontrado." });
      }

      let finalAmount = amount;

      // Verificar si el campo membership está vacío o es 0
      if (!user.membership || user.membership === 0) {
          // Asignar 500 al campo membership
          user.membership = 500;

          // Restar 500 del monto de la transacción
          finalAmount -= 500;

          // Verificar que el monto no sea negativo
          if (finalAmount < 0) {
              return res.status(400).json({ error: "El monto de la transacción no puede ser menor a 500." });
          }

          // Guardar el usuario actualizado
          await user.save();
      }

      const transaction = new Transaction({
          userId,
          amount: finalAmount,
          date,
          hash,
      });

      const savedTransaction = await transaction.save();

      return res.status(201).json({
          message: "Transacción creada exitosamente.",
          transaction: savedTransaction
      });
  } catch (error) {
      console.error("Error al crear la transacción:", error);
      return res.status(500).json({ error: "Ocurrió un error en el servidor." });
  }
};

const getTransactionById = async (req, res) => {
  const { id } = req.params;

  try {
    const transactions = await Transaction.find({ userId: id });
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: "No se encontraron transacciones para este usuario." });
    }

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    return res.status(500).json({ error: "Ocurrió un error en el servidor." });
  }
};

module.exports = { createTransaction, getGroupedTransactions, getTransactionById };