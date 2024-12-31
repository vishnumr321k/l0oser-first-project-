const Coupen = require("../model/Admin/coupenSchema");
const Cart = require('../model/user/cartSchema');

const getCoupenPage = async (req, res) => {
    try {
       const coupens = await Coupen.find({}).sort({createdAt :  -1}); 
        let message = ""
        if(req.query.msg){
            message = req.query.msg
        }


        console.log('The Coupen page is loaded...🕺');
        res.render('coupen', {coupens,message}
        );
    } catch (error) {
        console.log('getCoupenPage:', error);
    }
}

const creteCoupen = async (req, res) => {
    try {
        const {couponCode, discountPercentage, minimumPrice, endDate} = req.body;
        console.log('{couponCode, discountPercentage, minimumPrice, endDate} :', {couponCode, discountPercentage, minimumPrice, endDate} )
        // const existingCoupen = await Coupen.findOne({couponCode})
        // console.log('existingCoupen:', existingCoupen)
        // if(existingCoupen){
        //     return res.redirect(`/admin/coupen-page?msg=Coupen already exist.`)
        // }

        const coupen = new Coupen({
            couponCode:couponCode,
            coupenDiscountPercentage: discountPercentage,
            minPrice: minimumPrice,
            endAt:endDate
        })

        await coupen.save()

        console.log('Coupen Created SuccessFully...😎')
        res.redirect(`/admin/coupen-page`)
    } catch (error) {
        console.log('createCoupen:', error);
    }
}

const deleteCoupen = async (req, res) => {
    try {
        const couponId = req.body.couponId;

        if(!couponId){
            console.log('No coupen Id...')
        }

        if(couponId){
            await Coupen.findByIdAndDelete(couponId);
        }

        res.redirect('/admin/coupen-page');

    } catch (error) {
        console.log('deleteCoupen:', error);
    }
}


// const applyCoupon = async (req, res) => {
//     try {
//         const userId = req.session.userId;
//         const {couponCode} = req.body;

        
        
//         const coupon = await Coupen.findOne({coupenCode:couponCode});
//         console.log('coupon:', coupon);

//        const cart = await Cart.findOne({userId}).populate('products.productId');
//         console.log("Cart:", cart);
//        const finalTotal = cart.products.reduce((sum, product) => {
//         return sum + (product.productId.salePrice)
//        }, 0);

//        console.log("finalTotal:", finalTotal);

//        let discount = (subtotal * coupon.coupenDiscountPercentage) / 100;
//        console.log("discount:", discount);
//        const subtotal = finalTotal - discount;
//        console.log("discount:", discount);
//        req.session.applidCoupenData = {
//             code : couponCode,
//             discount,
//             subtotal
//        }


//        return res.json({
//         success: true,
//         message: `Coupon applied successfully...`,
//         discount,
//         subtotal
//        })
//     } catch (error) {
//         console.error('Error applying coupon:', error);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// }


const applyCoupon = async (req, res) =>{
    try {
        const couponCode = req.body.couponCode;
        const subtotal = req.body.finalTotal;
        console.log('subTotal:', subtotal);
        console.log('couponCode:', couponCode)
        const coupon = await Coupen.findOne({couponCode: couponCode});
        console.log('coupon:', coupon)
        if(!coupon){
            console.log('! no coupen')
            return res.json({success: false, message: 'Invalid coupon code...😶‍🌫️'});
        }

        const todayDate =  new Date();
        if(todayDate > coupon.endAt){
            console.log('! no failed the today date')
            return res.json({success: false, message: 'Invalid coupen You used..'});
        }

        
        if(subtotal < coupon.minPrice){
            console.log('! no subtotal < coupon.minPrice')
            return res.json({
                success: false,
                message: ' Minimum Price is not mathc you enter Coupon code...'
            });
        }

        const discount = Math.ceil(subtotal * coupon.coupenDiscountPercentage) / 100;
        const newSubtotal = Math.ceil(subtotal - discount);
        console.log('discount:', discount);
        console.log('newSubtotal:', newSubtotal)
        req.session.discount = discount;
        req.session.newSubtotal = Math.ceil(newSubtotal);
        req.session.coupenCode = couponCode;
       

        res.json({
            success: true,
            discount: discount,
            newSubtotal: newSubtotal
        })
    } catch (error) {
        console.log('Error applying coupen:', error);
        res.status(500).json({success: false, message: 'Internal server error...'});
    }
}


const removeCoupon = async (req, res) => {
    try {
        
        const subTotal = req.body.subTotal
        req.session.newSubtotal = subTotal;
        req.session.discount = 0;
        console.log('defultSubtotal:', subTotal)

        res.json({
            success: true,
            defultSubtotal:subTotal 
        })
    } catch (error) {
        console.log('removeCoupon:', error);
        res.status(500).json({success: false, message: 'removeCoupen is Failed....😶‍🌫️'});
    }
}


const getCouponList = async (req, res) => {
    try {
        const userId = req.session.userId;
        const coupons = await Coupen.find({});
        


        res.render('coupon-list', {
            coupons,
            userId
        })
    } catch (error) {
        console.log('getCouponList:', error);
    }
}

module.exports = {
    getCoupenPage,
    creteCoupen,
    deleteCoupen,
    applyCoupon,
    removeCoupon,
    getCouponList
}