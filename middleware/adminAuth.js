const is_adminLogin = (req, res, next) =>{
    if(!req.session || !req.session.adminId){
        console.log('Unauthorized access attempt. Redirecting to login....');
        return res.redirect('/admin/signin');
    }
    console.log('Admin autherntivated. proceeding...')
    next();
}



const is_redirectLogin = (req, res, next) => {
    if(req.session && req.session.adminId){
        console.log('User is already logged in. Redirecting...');
        return res.redirect('/admin/dashe-board');
    }
    next();
}

module.exports = {
    is_adminLogin,
    is_redirectLogin
}