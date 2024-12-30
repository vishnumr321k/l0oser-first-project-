const mongoose = require('mongoose');
const {Schema} = mongoose;


const addressSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    addressType: {
        type: String,
        enum: ['Home', 'Office', 'Other'], 
        required: true
    },
    Username: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    streetAddress: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true,
        
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        
    },
    altMobile: {
        type: String,
        trim: true,
       
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
