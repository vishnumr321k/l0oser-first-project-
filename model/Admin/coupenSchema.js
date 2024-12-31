const mongoose = require('mongoose');
const {Schema} = mongoose;

const coupenSchema = new Schema({
    couponCode:{
        type: String,
        required: false,
        unique: true,
        trim: true
    },
    coupenDiscountPercentage:{
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    minPrice:{
        type: Number,
        required: true,
        min: 0
    },
    createdAt :{
        type: Date,
        default: Date.now()
    },
    endAt:{
        type: Date,
        required: true
    },
   
});

const Coupen = mongoose.model('Coupen', coupenSchema);

module.exports = Coupen