const mongoose = require('mongoose');
const {Schema} = mongoose;

const wishlistSchema = new Schema({
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        products:[
            { 
                productId:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required:true,
                },
                createAt:{
                    type: Date,
                    default: Date.now
                }
            }
        ]
})


const WishList = mongoose.model('WishList', wishlistSchema);

module.exports = WishList