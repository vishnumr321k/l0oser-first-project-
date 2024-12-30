
const User = require('../model/user/UserSchema');
const Admin = require('../model/Admin/AdminSchema');

const userAuth = (req,res,next) =>{
    if(req.session.userId){
        User.findById(req.session.userId)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                res.redirect('/signup')
            }
        })
        .catch(error=>{
            console.log("Error in user auth middlewaare",error);
            res.status(500).send("Internal sserver error")
        })
    }else{
        res.redirect('/login')
    }
}

const userBlock  =  (req, res, next ) =>{
   if(req.session.userId){
    User.findById(req.session.userId)
    .then(data => {
        if(data && data.isBlocked){
            next()
        }else{
            res.redirect('/signup')
        }
    })
    .catch(error => {
        console.error('userBlock:', error);
        res.status(500).send('Internal Server Error...');
    })
   }
}

const adminAuth = async (req, res, next) => {
        if(req.session.adminId){
            try {
                const admin = await Admin.findById(req.session.adminId);
                if(admin){
                   
                    return next();
                }else{
                   
                    return res.redirect("/admin/signin")
                }
            } catch (error) {
                console.log("error in admin auth");
            }
        }else{
            res.redirect("/admin/signin")
        }
}

module.exports = {
    userAuth,
    adminAuth,
    userBlock
}
