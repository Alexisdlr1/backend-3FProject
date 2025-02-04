const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");

// Add new wallet for withdraw
const addWithdrawWallet = async (req, res) => {

  const { id } = req.params;
  const { wallet } = req.body;

  try {
    if (!wallet || !id) return res.status(401).json({ message: "Faltan datos para peticion" });

    // Validar el formato del ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    
    const updateDate = new Date();
    const releaseDate = updateDate.setDate(releaseDate.getDate() + 1);

    const user = await User.findOneAndUpdate(
      { _id: id },
      { withdrawalWallet: { 
        wallet,
        isActive: false,
        isUsable: false,
        releaseDate,
        updateDate, 
      } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.status(200).json({ message: "Wallet para retiro agregada exitosament" });
  } catch (error) {
    res.status(500).json({ message: "Error al agregar wallet para retiro.", error: error.message });
  }

};

const updateWithdrawalWallet = async (req, res) => {

  const { id } = req.params;
  const updates = req.body;

  try {
    
    if (!updates || typeof updates !== "object" || id) return res.status(401).json({ message: "Faltan datos para peticion" });

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    // Buscar y actualizar el usuario con el nuevo valor en withdrawalWallet
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { "withdrawalWallet": { ...updates } } }, // Sobrescribe los valores existentes
      { new: true, runValidators: true } // Retorna el usuario actualizado y valida los datos
    );

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.status(200).json({ message: "Withdrawal wallet actualizada con éxito", user });
  } catch (error) {
    return { message: "Error al actualizar withdrawalWallet:", error: error.message };
  }
};


// enable wallet for withdraw

module.exports = { addWithdrawWallet, updateWithdrawalWallet };
