const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const { getCommissionsPerSaving, getMembershipAmount, getMembershipToBusiness, getMembershipToUpline } = require("../business/commission");
const { depositMembershipToBusiness, depositSavingToBusiness } = require("../business/deposit");
const {
    createMembershipPaymentNotification,
    createNewSavingNotification,
    createCommissionNotification,
} = require("../utils/notification");
const Business = require("../models/businessModel");

// Ruta para obtener las transacciones agrupadas por usuario
const getGroupedTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalUsers = await Transaction.aggregate([
            { $group: { _id: "$userId" } }, // Agrupar por userId para contar usuarios únicos
            { $count: "total" } // Contar el total de usuarios
        ]);

        const total = totalUsers.length > 0 ? totalUsers[0].total : 0;
        const totalPages = Math.ceil(total / limit); // Calcular el total de páginas

        // Si no hay usuarios, devolver una respuesta vacía
        if (total === 0) {
            return res.status(404).json({
                error: "No se encontraron transacciones.",
                totalUsers: 0,
                totalPages: 0,
                page,
                data: [],
            });
        }

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
                    userDetails: { 
                        name: 1,
                        email: 1,
                        totalBalance: 1,
                        uplineCommisions: 1,
                        wallet: 1,
                        withdrawalWallet: 1,

                    },
                },
            },
            { $skip: skip },
            { $limit: limit },
        ]);

        const processedData = await Promise.all(transactions.map(async (groupByUser) => {
            const userInfo = groupByUser.userDetails[0] || null;
            const uplineWallets = userInfo ? userInfo.uplineCommisions || [] : [];

            const uplinesInfo = await Promise.all(
                uplineWallets.map(async (wallet, index) => {
                    const user = await User.findOne({ wallet });
                    if (!user) return null;
                    return {
                        userId: user._id,
                        email: user.email,
                        name: user.name,
                        level: index + 1,
                    };
                })
            );

            const sortedTransactions = groupByUser.transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));


            return {
                userId: groupByUser.userId,
                userDetails: userInfo,
                transactions: sortedTransactions.map((tx, index) => {
                    const amount = tx.amount.toString() || 0;
                    const commisionsPerLevel = getCommissionsPerSaving(amount)

                    return {
                        amount,
                        membershipAmount: index === 0 ? getMembershipAmount() : null,
                        membershipToBusiness: index === 0 ? getMembershipToBusiness() : null,
                        membershipToUpline: index === 0 ? getMembershipToUpline() : null,
                        sendedCommisions: commisionsPerLevel.map((commission, index) => {
                            const upline = uplinesInfo[index] || {};
                            return {
                                name: upline.name || "BUSINESS",
                                email: upline.email || "BUSINESS",
                                amount: commission,
                                level: upline.level || "BUSINESS",
                                wallet: upline.wallet || "BUSINESS",
                            };
                        }),
                        date: tx.createdAt,
                        status: tx.status,
                        hash: tx.hash,
                    }
                }),
            }
        }));

        return res.status(200).json({
            message: "Transacciones agrupadas por usuario obtenidas exitosamente.",
            totalUsers: total,
            totalPages,
            page,
            limit,
            data: processedData,
        });

    } catch (error) {
        // console.error("Error al obtener transacciones agrupadas:", error);
        return res.status(500).json({ error: "Ocurrió un error en el servidor." });
    }
};

// Controlador para crear una transacción
const createTransaction = async (req, res) => {
    const MEMBERSHIP_AMOUNT = 500;
    const MEMBERSHIP_TO_UPLINE = 100;
    const MEMBERSHIP_TO_BUSINESS = MEMBERSHIP_AMOUNT - MEMBERSHIP_TO_UPLINE;

    try {
        const { userId, amount, date, hash } = req.body;

        if (!userId || !amount) {
            return res.status(400).json({ error: "userId y amount son requeridos." });
        }

        if (isNaN(parseFloat(amount))) {
            return res.status(400).json({ message: "El monto debe ser un número válido." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        const userEmail = user.email;
        const uplines = user.uplineCommisions
        const directUpline = await User.findOne({ wallet: uplines[0] });
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

            // Registrar membresia hacia el negocio
            const registered = depositMembershipToBusiness(MEMBERSHIP_TO_BUSINESS);

            if (!registered) {
                return res.status(400).json({ error: "El monto de la membresia no puedo ser registrado." });
            }

            // Actualiza el campo membership si esta correcto
            user.membership = MEMBERSHIP_AMOUNT;

            // Emite notificacion de pago de membresia
            await createMembershipPaymentNotification(userEmail, MEMBERSHIP_AMOUNT);

            // Emite notificacion de comision de membresia al upline
            if (directUpline) {
                const emailUpline = directUpline.email;
                await createCommissionNotification(emailUpline, MEMBERSHIP_TO_UPLINE);
            }
        }

        // Actualiza el balance de ahorros activos en el negocio
        const registered = depositSavingToBusiness(finalAmount);

        if (!registered) {
            return res.status(400).json({ error: "El monto del ahorro no puedo ser registrado." });
        }

        // Acutaliza el monto para balance
        const currentMemberBalance = parseFloat(user.totalBalance);
        const newMemberBalance = currentMemberBalance + parseFloat(finalAmount);

        // Actualiza el balance de los ahorros totales de cada miembro
        user.totalBalance = newMemberBalance;

        //Emite notificacion
        await createNewSavingNotification(userEmail, finalAmount);

        // Guardar el usuario actualizado
        await user.save();

        // Obtener valor de comisiones
        const commissions = getCommissionsPerSaving(finalAmount);

        // Emite notificaciones para referidos
        for (let i = 0; i < 3; i++) {
            // verifica que exista una direccion
            if (!uplines[i]) break;

            // si existe busca a un usuario
            const user = await User.findOne({ wallet: uplines[i] });

            // en caso de no existir continua
            if (!user) continue;

            const userEmail = user.email;

            // Emite una nueva notificacion para comision
            await createCommissionNotification(userEmail, commissions[i]);
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
        // console.error("Error al crear la transacción:", error);
        return res.status(500).json({ error: "Ocurrió un error en el servidor." });
    }
};

const getTransactionAndBalanceById = async (req, res) => {

    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "El atributo 'id' es obligatorio." });
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find({ userId: id })
            .skip(skip)
            .limit(limit)
            .sort({ date: -1 });

        const totalTransactions = await Transaction.countDocuments({ userId: id });

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
        // console.error("Error al obtener transacciones y balance:", error);
        return res.status(500).json({ error: "Ocurrió un error en el servidor." });
    }
};

module.exports = { createTransaction, getGroupedTransactions, getTransactionAndBalanceById };