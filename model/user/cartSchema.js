const mongoose = require('mongoose');
const {Schema} = mongoose;

const  cartSchema = new Schema({
     userId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true,
     },
     products:[
        {
            productId:{
                type: mongoose.Schema.Types.ObjectId,
                ref:"Product",
                require: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
              },
            color:{
               type: Number,
               require: false,
            },
            size:{
               type: String,
               require: false,
               min: 1
            },
            totalPrice:{
               type : Number,
               default: 0,
            },
        },
     ],
     
     createdAt:{
        type: Date,
        default: Date.now,
     },
})

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;