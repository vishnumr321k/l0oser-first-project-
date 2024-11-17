const Admin = require('../model/Admin/AdminSchema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Checking the server is working or not 
const serverChecking = async(req, res) =>{
    try {
        res.send('The server is success');
    } catch (error) {
        console.log(error)
        res.status(404).send('The page not fount');
    }
}

// geting the signin
const loadSignin = async (req, res) => {
    try {
        console.log('The Signin loaded');
        res.render('admin-login');
    } catch (error) {
        console.log(`The signin not loaded and error seen ${error}`);
        res.status(404).send('Page not Found');
    }
}

// geting the Dashboard
const loadDasheBoard = async (req, res) => {
    try {
        console.log('The Dasheboard loaded');
        res.render('dasheBoard');
    } catch (error) {
        console.log(error);
        res.status(404).send('Page not Found');
    }
}

const adminSignin = async(req, res) =>{
    const {email, password} = req.body;
    try {
        const admin = await Admin.findOne({email});
        if(!admin){
            console.log("Admin not Found..🤦");
            return res.status(401).send('Authentication Failed...😎')
        }
        // compare the passwords 
        const is_Match = await bcrypt.compare(password, admin.password);

        if(is_Match){
            console.log("Admin Authetication Successfully...😁");
            return res.redirect('/admin/dashe-board');
        }else{
            console.log('Incorrect Password...🕺');
            return res.status(401).send('Authentication Failed...😒');
        }


        // if(admin && admin.password === password){
        //     console.log("Admin authenticated successfully!");
        //    return res.redirect('/admin/dashe-board')
        // }else{
        //     console.log("Incorrect password!");
        //     return res.status(401).send("Authentication failed!");
        // }
    } catch (error) {
        console.log(`Error during sign-in: ${error}`);
        return res.status(500).send("Internal server error");
    }
}


module.exports ={
    serverChecking,
    loadSignin,
    loadDasheBoard,
    adminSignin
} ;
