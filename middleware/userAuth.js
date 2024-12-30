const User = require('../model/user/UserSchema');

const is_userlogin = (req, res, next) =>{
    if(!req.session || !req.session.userId){
        console.log('Unautherized access attemt. REdirect to login...');
        return res.redirect('/login');
    }
    console.log('User Authernticated . proceeding...');
    next();
}

const is_redirectUser = (req, res, next) =>{
    if(req.session && req.session.userId){
        console.log('User is already logged in. Redirect...');
        return res.redirect('/home');
    }
    next();
}

const googleLogin = (req, res, next) => {
     if(req.isAuthenticated()){
        return next();
     }
     res.redirect('/login');
};


// const is_userlogin = (req, res, next) =>{
//     if(req.session.user){
//         User.findById(req.session.user)
//         .then(data => {
//             if(data && !data.isBlocked){
//                 next();
//             }else{
//                 res.redirect('/login');
//             }
//         })
//         .catch(error =>{
//             console.log('Error in user Auth MiddleWare',error)
//             res.status(500).send('Internal Server Error');
//         })
//     }else{
//         res.redirect('/login');
//     }
// }


// const AdminAuth = (req, res, next) =>{
//     User.findOne({isAdmin:true})
//     .then(data =>{
//         if(data){
//             next();
//         }else{
//             res.redirect('/admin/login')
//         }
//     })
//     .catch(error =>{
//         console.log('Error in Admin Middleware', error);
//         res.status(500).send('Internal SErver Error');
//     })
// }


module.exports = {
    is_userlogin,
    is_redirectUser,
    googleLogin
}