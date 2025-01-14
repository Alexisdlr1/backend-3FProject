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
  const MEMBERSHIP_AMOUNT = 500;

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

      // Verificar que el monto no sea negativo
      if (finalAmount < 0) {
        return res.status(400).json({ error: "El monto de la transacción no puede ser negativa." });
      }

      // Verificar si el campo membership está vacío o es 0
      if (!user.membership || user.membership === 0) {
          // Restar Valor de membresia del monto de la transacción
          finalAmount -= MEMBERSHIP_AMOUNT;

          // Verificar que efectivamente corresponda al monto requerido
          if (amount - finalAmount !== MEMBERSHIP_AMOUNT) {
              return res.status(400).json({ error: "El monto de la transacción no puede ser menor a 500." });
          }

          // Actualiza el campo membership si esta correcto
          user.membership = MEMBERSHIP_AMOUNT;
      }

      // Actualiza el balance de los ahorros totales de cada miembro
      user.totalBalance += finalAmount;
        
      // Guardar el usuario actualizado
      await user.save();

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

const getTransactionAndBalanceById = async (req, res) => {
  
  try {
    const { id } = req.params.id;

    if (!id) {
      return res.status(400).json({ error: "El atributo 'id' es obligatorio." });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId: id });
      // .skip(skip)
      // .limit(limit)
      // .sort({ date: -1 });

    const totalTransactions = await Notification.countDocuments({ userId: id });
    
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: "No se encontraron transacciones para este usuario." });
    }

    return res.status(200).json({
      total: totalTransactions,
      page,
      pages: Math.ceil(totalTransactions / limit), 
      transactions, 
      balance: user.totalBalance 
    });
  } catch (error) {
    console.error("Error al obtener transacciones y balance:", error);
    return res.status(500).json({ error: "Ocurrió un error en el servidor." });
  }
};

module.exports = { createTransaction, getGroupedTransactions, getTransactionAndBalanceById };