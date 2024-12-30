
const Cart = require('../model/user/cartSchema');
const WishList = require('../model/user/wishlistSchema');
const fetchCartProductCount = async (req, res, next) => {
    if (req.session.userId) {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ userId });

        if (cart) {
            res.locals.productCount = cart.products.length;
        } else {
            res.locals.productCount = 0;
        }
    } else {
        res.locals.productCount = 0;
    }
    next();
};


const wishlistAddProductCount = async (req, res, next) => {
    if(req.session.userId){
        const userId = req.session.userId;
        const wishList = await WishList.findOne({userId})
        if(wishList){
            res.locals.wishProduct = wishList.products.length;
        }else{
            res.locals.wishProduct = 0;
        }
    }else{
        res.locals.wishProduct  = 0;
    }
    next();
}

module.exports = {
    fetchCartProductCount,
    wishlistAddProductCount
}