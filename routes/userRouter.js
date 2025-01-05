const express = require('express');
const router = express.Router();
const userControler = require('../controller/userController');
const userAuth = require('../middleware/userAuth');
const passport = require('passport');
const Product = require('../model/Admin/productSchema');
const productController = require('../controller/productController');
const profileControllers = require('../controller/User/profileControllers');
const userShow = require('../controller/User/userShow');
const cartController = require('../controller/cartController');
const blockAuth = require('../middleware/authMiddleWare')
const razorPaymetCopy = require('../config/razorpayment');
const paymetnController = require('../controller/paymentSection');
const coupencontroller = require('../controller/coupenController');
const wishListController = require('../controller/wishListController');




router.use((req, res, next) =>{
    res.locals.user = req.session.userId || null;
    res.locals.userData = req.session.userData || null;
    next()
})

router.get('/login', userControler.loadLogin);
router.get('/signup', userControler.loadSignup);
router.get('/home',userControler.loadHomepage);
router.post('/signup',userControler.userSignup);
router.post('/verify-otp', userControler.verifyOtp);
router.post('/login',userControler.userLogin);
router.get('/logout', userControler.userLogout);
router.post('/resend-otp', userControler.resendOtp);
router.get('/about-page', userControler.aboutPage);
router.get('/contact-page', userControler.contactDetails);


router.get('/auth/google', passport.authenticate('google', {scope : ['profile', 'email']}));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signup' }),
    (req, res) => {
        console.log('Authenticated user:', req.user);
        console.log('Is Authenticated:', req.isAuthenticated());
        req.session.userId = req.user;

        if (req.isAuthenticated()) {
            console.log('Redirecting to /home...');
            const googleId = req.user?.googleId;
            if(googleId){
                req.session.googleId = googleId;
            }else{
                console.log('Google Id Found for Authenticated user...');
            }
            
            return res.redirect('/home');
        }

        console.log('Unauthorized access attempt. Redirecting to /login...');
        res.redirect('/login');
    }
);


router.get('/forgot-password', profileControllers.forgotPassPage);
router.post('/forgot-email-valid', profileControllers.forgotEmailValid);
router.get('/forgot-password-otp', profileControllers.getotp);
router.post('/verify-otp-to-new', profileControllers.verifyOtpAndRedirect);
router.post('/new-password', profileControllers.resetPassword);
router.post('/update-password', profileControllers.saveNewPassword);


// User view 
router.get('/productdetails', userShow.getProductList);
router.post ('/product-review', productController.addReview);
router.get('/product-list', productController.productList);


// profle view 
router.get('/profile', userControler.getProfile);
router.patch('/profile/update', userControler.updateProfile);
router.get('/add-address', userControler.addAddress);
router.post('/save-address', userControler.addAddressDate);
router.get('/edit-address', userControler.loadEditAddress);
router.patch('/edit-address', userControler.editAddress);
router.delete('/delete-address', userControler.deleteAddress)
router.get('/order-list', userControler.orderList);
router.post('/update-password-profile', userControler.updatePasswordInProfile);




// User Cart 
router.post('/add-to-cart/:id', cartController.addToCart);
router.get('/user-cart', cartController.getUserCart);
router.delete('/remove-cart-item', cartController.removeCartItem);
router.put('/update-quantity', cartController.updateQuantity);
router.post('/add-to-cart-direct', cartController.addToCartDirect);


// chekout
router.get('/checkout', productController.getChekout);
router.post('/placeOrder', productController.placeOrder);
router.get('/order-details', productController.orderDetails);
router.post('/order-cancellation', productController.orderCancellation);
router.post('/return-deliverd-order', productController.retrnDeliverdOrder)
router.get('/order-success/:id', paymetnController.orderSuccessPage);
router.get('/order-report-download-pdf/:orderId', productController.orderInvoiceDownlod)



// razorPay
router.post('/create-razorpay-order', paymetnController.createRazorpayOrder);
router.post('/verify-Payment', paymetnController.verifyPayment);
router.post('/retry-payment', paymetnController.retryPayment)




// coupen
router.get('/coupon-list', coupencontroller.getCouponList)
router.post('/apply-coupom', coupencontroller.applyCoupon)
router.post('/remove-coupon', coupencontroller.removeCoupon);


// wishlist
router.get('/wishlist-page', wishListController.getWishList);
router.post('/add-whishlist-product', wishListController.addWhishListProduct);
router.post('/add-to-cart-wishlist', wishListController.addToCartDirectInWishList);
router.post('/remove-product-in-wishlist', wishListController.removeProductInWishlist)

// Wallet
router.get('/user-wallet', productController.getWalletPage);
router.post('/add-money-wallet', paymetnController.addMoneyWallet);
router.post('/wallet-verify-Payment', paymetnController.walletVerifyPayment)
router.post('/wallet-faile-payment', paymetnController.failePayment)









module.exports = router;