const mongoose = require('mongoose');
const {Schema} = mongoose;

const walletSchema = new Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    balance:{
        type: Number,
        default:0
    },
    transactions:[
        {
        whichTransaction:{
            type: String,
            enum: ['Debit', 'Creadit'],
            required: true
        },
        creatAt:{
            type: Date,
            default: Date.now()
        },
        transactionAmount:{
            type: Number,
            default: 0
        },
        orderId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: false
        }
        }    
    ]
})


const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;