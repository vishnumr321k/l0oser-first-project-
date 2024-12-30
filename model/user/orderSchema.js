const mongoose = require('mongoose');
const {Schema} = mongoose;

const newLocal = 'COD';
const orderSchema = new Schema({
    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    orderId:{
        type: String,
        required: true
    },
    discount:{
        type: Number,
        require: false,
        default: 0,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref:'Product'
            },
            quantity:{
                type: Number,
                required: true
            },
            price: {
                type: Number, 
                required: true
            },
            status:{
                type: String,
                enum:['Pending', 'Processing', 'Shipped', 'Deliverd', 'Cancelled', 'Return'],
                default: 'Pending',
            },
            
        },
    ],
    totalAmount:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        enum:['Pending', 'Processing', 'Shipped', 'Deliverd', 'Cancelled', 'Return'],
        default: 'Pending',
    },
    paymentMethord:{
        type: String,
        enum:["COD", "Online"],
        
        required: true,
    },
    paymentStatus:{
        type: String,
        enum: ['Pending', 'Complete', 'Failure'],
        default:'Pending',
    },
    address:{
        addressType: {
          type: String,
          required: true
        },
        name:{
            type: String,
            required: true,
        },
        streetAddress: {
            type: String,
            required: true,
        },
        city:{
            type:String,
            required: true
        },
        state:{
            type: String,
            required: true
        },
        pincode:{
            type: String,
            required: true,
        },
        mobile:{
            type: String,
            required: true 
        },
        altmobile:{
            type: String,
            required: true 
        },
    },
    orderDate:{
        type: Date,
        default: Date.now()
        
    },
    lastUpdate:{
        type: Date,
        default: Date.now()
    },
    coupenCode:{
      type: String,
      required: false,  
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;