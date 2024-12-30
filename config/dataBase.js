const mongoose = require('mongoose');
const Admin = require('../model/Admin/AdminSchema');
const env = require('dotenv').config();



const connectDb = async() =>{
    try {
        await mongoose.connect(process.env.mongoURI)
        console.log('Database Connected...')

        const exitingAdmin = await Admin.findOne({email: 'admin123k@gmail.com'});
        if(!exitingAdmin){
            const defultAdmin = new Admin({
                name: 'Vishnu M R',
                email: 'admin123k@gmail.com',
                password: 'admin123',
                isAdmin: 1
            });
            await defultAdmin.save();
            console.log('Defult Admin Created Successfully!');
        }else{
            console.log('Admin alreay exists!');
        } 
    } catch (error) {
        console.log(`DB Connect Failed ${error}`);
        process.exit(1)
    }
}

module.exports =  connectDb