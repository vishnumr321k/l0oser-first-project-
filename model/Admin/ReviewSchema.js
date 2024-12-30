const mongoose = require('mongoose');
const {Schema} = mongoose;


const ReviewSchema = new Schema ({
    comment:{
        type: String,
        required: true
    },
    name:{
        type:String,
        required: false
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:false
    },
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: false
    }
})


const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review