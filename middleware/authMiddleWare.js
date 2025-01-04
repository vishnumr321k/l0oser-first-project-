
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
const checkIsBlock = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(userId);
        if (user && user.isBlocked) {
            req.session.destroy(); // Clear the session
            return res.status(403).render('login', {
                error: 'Your account has been blocked. Please contact support.',
                passErr: ''
            });
        }

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error checking if user is blocked:', error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    userAuth,
    adminAuth,
    userBlock,
    checkIsBlock
}
