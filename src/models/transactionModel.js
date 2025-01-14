const mongoose = require("mongoose");
import { getDateForPYT, getDateForCommission } from "../utils/timestamp";


const PyTSchema = new mongoose.Schema({
    paymentDay: { type: Date, required: true },
    amount: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    status: { 
        type: String,
        enum: [
            "Fallido",
            "Pagado",
            "Pendiente"
        ],
        default: "Pendiente"
     }
});

const CommissionSchema = new mongoose.Schema({
    paymentDay: { type: Date},
    amount: { type: Number, default: 0 },
    activeCommissions: { type: Boolean, default: false },
    status: { 
        type: String,
        enum: [
            "Fallido",
            "Pagado",
            "Pendiente"
        ],
        default: "Pendiente"
     }
})

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    pyt:[PyTSchema],
    commissions: CommissionSchema,
    status: { 
        type: String, 
        enum: [
            "Iniciado",
            "Pendiente",
            "Finalizado",
            "Fallido",
            "En rendimientos"
        ], 
        default: "Iniciado" },
    hash: {type: String, required: true},
}, { timestamps: true });

// Middleware para generar automáticamente los PyT
transactionSchema.pre('save', function(next) {
    try {
        // Solo generamos los PyT si es un documento nuevo y aún no tiene ninguno
        if (this.isNew && (!this.pyt || this.pyt.length === 0)) {
            const pytArray = [];
            let currentDate = new Date(this.date); // Usamos la fecha de la transacción como inicio
            
            // Calculamos el monto para cada pago (dividimos el monto total entre 3)
            const paymentAmount = this.amount / 3;
            
            // Generamos los 3 PyT
            for (let i = 0; i < 3; i++) {
                const paymentDay = i === 0 ? currentDate : getDateForPYT(currentDate);
                
                pytArray.push({
                    paymentDay: paymentDay,
                    amount: paymentAmount,
                    isPaid: false,
                    status: "Pendiente"
                });
                
                // La fecha fin de este pago será la fecha inicio del siguiente
                currentDate = paymentDay;
            }
            
            this.pyt = pytArray;

            const nextPaymentDate = getDateForCommission(currentDate);
            const nextCommission = {
                paymentDay: nextPaymentDate,
                amount: 0,
                activeCommissions: false,
                status: "Pendiente"
            }

            this.commissions = nextCommission;
        }
        next();
    } catch (error) {
        next(error);
    }
});


const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;