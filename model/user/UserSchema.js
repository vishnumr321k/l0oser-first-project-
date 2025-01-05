const mongoose = require('mongoose');
const Address = require('./addressSchema');
const {Schema} = mongoose;

const userSchema = new Schema({
    name:{
        type: String,
        require:true
    },
    email:{
        type: String,
        require: true,
        trim: true
    },
    password:{
        type: String,
        require:false,
    },
    mobile:{
        type: Number,
        required: false,
        default:null,
        
    },
    googleId:{
        type: String,
        uniqu:true,
        require: false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    isBlocked:{
        type: Boolean,
        defualt: false

    },
    addresses: [{
        addressType: String,
        name: String,
        state: String,
        city: String,
        streetAddress: String,
        pincode: String,
        mobile: String,
        altMobile: String,
    }],
    selectedAddressIndex: { 
        type: Number, 
        default: null
    },
    creatAt:{
        type: Date,
        default: Date.now()
    }

});

const User = mongoose.model('User', userSchema);

module.exports = User;