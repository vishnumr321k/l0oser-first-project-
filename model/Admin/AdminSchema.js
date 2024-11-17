const mongoose = require('mongoose');
const {Schema} = mongoose;
const bcrypt = require('bcryptjs'); 

const adminSchema = new Schema({
    name:{
        type: String,
        required: false
    },
    email:{
        type: String,
        required: true,
        uniqe: true
    },
    password:{
        type:String,
        required:true
    }
})

adminSchema.pre('save', async function(next) {
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;