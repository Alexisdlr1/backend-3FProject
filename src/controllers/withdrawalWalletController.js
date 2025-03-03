const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");

// Add new wallet for withdraw
const addWithdrawWallet = async (req, res) => {

  const { id } = req.params;
  const { wallet } = req.body;

  try {
    if (!wallet || !id) return res.status(401).json({ message: "Faltan datos para peticion" });

    // Validar el formato del ID
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });
    
    const updateDate = new Date();
    const releaseDate = new Date(updateDate);
    releaseDate.setDate(releaseDate.getDate() + 1);

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

    res.status(200).json({ message: "Wallet secundaria agregada exitosamente!" });
  } catch (error) {
    res.status(500).json({ message: "Error al agregar wallet secundaria.", error: error.message });
  }

};

const enableWithdrawalWallet = async (req, res) => {

  const { id } = req.params;
  const { isActive } = req.body;

  try {
    if (!req.body.hasOwnProperty("isActive") || typeof isActive !== "boolean" || !id) {
      return res.status(401).json({ message: "Faltan datos para la petición" });
    }

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (!user.withdrawalWallet || !user.withdrawalWallet.releaseDate) {
      return res.status(400).json({ message: "No hay wallet registrada o fecha de liberación inválida" });
    }
    
    const walletTimestamp = new Date(user.withdrawalWallet.releaseDate);
    const releaseTimestamp = walletTimestamp.getTime();
    const serverTimestamp = Date.now();

    if (releaseTimestamp > serverTimestamp) {
      return res.status(403).json({ 
        message: `Wallet bloqueada hasta ${walletTimestamp.toLocaleString()}` 
      });
    }

    user.withdrawalWallet.isActive = isActive;

    await user.save();

    res.status(200).json({ message: "Wallet secundaria actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar wallet secundaria.", error: error.message });
  }
};

const deleteWithdrawalWallet = async (req, res) => {
  
  const { id } = req.params;

  try {
    
    if (!id) return res.status(401).json({ message: "Faltan datos para peticion" });

    // Validar el formato del ID
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "ID inválido." });

    // Buscar y eliminar el usuario
    const user = await User.findOneAndUpdate(
      { _id: id },
      { $unset: { "withdrawalWallet": {} } },
      { new: true, runValidators: true }
    );

    // Verificar si el usuario fue encontrado y eliminado
    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

    res.status(200).json({ message: "Wallet secundaria eliminada exitosamente"});
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar wallet secundaria.", error: error.message });
  }
}


// enable wallet for withdraw

module.exports = { addWithdrawWallet, enableWithdrawalWallet, deleteWithdrawalWallet };
