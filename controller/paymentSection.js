const Order = require('../model/user/orderSchema');
const razorPaymetCopy = require('../config/razorpayment');
const Cart = require('../model/user/cartSchema');
const User = require('../model/user/UserSchema');
const Product = require('../model/Admin/productSchema');
const crypto = require('crypto');
const Wallet = require('../model/user/walletSchema');
const env = require('dotenv').config();

const createRazorpayOrder = async (req, res) => {
    try {
        console.log('asoasdoias')
        const { subtotal, selectedAddressId, userId } = req.body;
        const discount = req.session.discount;
        const coupenCode = req.session.coupenCode;
        const discountPercentage = req.session.discountPercentage;
        // console.log('req.body:', req.body);
        console.log('subtotal:', subtotal);


        console.log('{theData fethc body}:', { subtotal, selectedAddressId, userId })
        const user = await User.findById(userId)
        const selectAddress = user.addresses[selectedAddressId]
        const cartProduct = await Cart.findOne({ userId: userId })
        const razorpaymentOrder = await razorPaymetCopy.orders.create({
            amount: subtotal * 100,
            currency: 'INR',
            receipt: `order-recipt-${Date.now()}`,
        })

        const newOrder = new Order({
            userId: user,
            orderId: razorpaymentOrder.id,
            discount: discount,
            discountPercentage: discountPercentage,
            products: cartProduct.products.map(product => ({
                productId: product.productId,
                quantity: product.quantity,
                price: product.totalPrice
            })),
            totalAmount: subtotal,
            status: 'Pending',
            paymentMethord: 'Online',
            paymentStatus: 'Failure',

            address: {
                addressType: selectAddress.addressType,
                name: selectAddress.name,
                streetAddress: selectAddress.streetAddress,
                city: selectAddress.city,
                state: selectAddress.state,
                pincode: selectAddress.pincode,
                mobile: selectAddress.mobile,
                altmobile: selectAddress.altMobile,
            },
            coupenCode: coupenCode,
        })
        console.log('newOrder:', newOrder)

        await newOrder.save();
        req.session.orderId = newOrder._id
        console.log('razorpaymentOrder:', razorpaymentOrder);
        res.status(200).json(razorpaymentOrder);



        const updateProductQuantity = cartProduct.products.map(async (product) => {
            const theProduct = await Product.findById(product.productId);
            if (theProduct) {
                const newQuantity = theProduct.quantity - product.quantity;
                await Product.findByIdAndUpdate(product.productId,
                    { quantity: newQuantity },
                )
            }
        })
        await Promise.all(updateProductQuantity);

        const order = await Order.findById(req.session.orderId)
        // if(order.paymentStatus === 'Complete'){
        const removeproductInCart = await Cart.findByIdAndDelete(cartProduct);
        // }


    } catch (error) {
        console.log('createRazorpayOrder:', error);
        res.status(500).json({ error: error.message || 'Failed to create a Razorpay Order' });
    }
}


const orderSuccessPage = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log('The order Success page loaded...');
        res.render('orderSuccess', { orderId });
    } catch (error) {
        console.log('orderSuccessPage', error);
    }
}


const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
        const orderingId = req.session.orderId;
        const sign = `${razorpayOrderId}|${razorpayPaymentId}`
        const hashCode = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest('hex');
        console.log(hashCode)
        console.log(razorpaySignature)

        if (hashCode === razorpaySignature) {
            const order = await Order.findById(orderingId)

            order.paymentStatus = 'Complete'
            order.status = 'Processing'
            order.lastUpdate = new Date()
            await order.save();
            if (!order) {
                console.log('The Order is not Found...🥲')
            }

            res.status(200).json(
                {
                    success: true, orderId: order._id, message: 'Payment Verifed successfully.'
                }
            )
        } else {

            const order = await Order.findById(orderingId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }

            order.paymentStatus = 'Failure'
            order.status = 'Pending'

            await order.save();

            res.status(404).json(
                { success: false, message: 'Invalid signature...🤦‍♂️', orderId }
            );
        }
    } catch (error) {
        console.log('verifyPayment:', error);
        res.status(500).json({ message: 'Internal server Error..', error: error.message });
    }
}

const retryPayment = async (req, res) => {
    try {

        const orderId = req.body.orderId;
        const subTotal = parseInt(req.body.subTotal)
        req.session.orderId = orderId
        const orders = await Order.findById(orderId);
        console.log('orderId:', orderId);
        console.log('subtotal:', typeof (subTotal));



        if (!orders) {
            return res.status(400).json({ success: false, message: 'Order not Fount...' });
        }

        const razorpaymentOrder = await razorPaymetCopy.orders.create({
            amount: subTotal * 100,
            currency: 'INR',
            receipt: `retry-order-detaile-${Date.now()}`,

        })

        console.log('razorpaymentOrder:', razorpaymentOrder)

        // orders.orderId = razorpaymentOrder.id;
        // orders.paymentStatus = 'Failure',
        // await orders.save();

        res.status(200).json({
            success: true,
            message: 'Retry Payment Successfully...',
            id: razorpaymentOrder.id,
            amount: razorpaymentOrder.amount,
            currency: razorpaymentOrder.currency,

        })
    } catch (error) {
        console.log('retryPayment:', error)
        res.status(500).json({
            success: true,
            message: 'Failed to retry payment...', error: error.message
        })
    }
}


const addMoneyWallet = async (req, res) => {
    try {
        const userId = req.session.userId;
        const walletAmount = parseInt(req.body.amount);
        
        if (!walletAmount || walletAmount < 500) {
            return res.status(404).json({ success: false, message: 'Wallet not Fount, Minimum amount is RS500' });
        }

        const razorpayOrder  = await razorPaymetCopy.orders.create({
            amount: walletAmount * 100,
            currency: 'INR',
            receipt: `wallet-add-${Date.now()}`,

        })


        
        res.status(200).json({
            success: true,
            message: 'Wallet money add Successfully...',
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        })

    } catch (error) {
        console.log('addMoneyWallet:', error)
        res.status(500).json({
            success: true,
            message: 'Failed to retry payment...', error: error.message
        })
    }
}


const walletVerifyPayment = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
        const hashCodeSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');
        
        console.log(razorpaySignature)

        if (hashCodeSignature === razorpaySignature) {
            
           
            const amount = req.body.amount;
            console.log('Typeof:', typeof(amount))
            console.log('amount:', amount)
            const wallet = await Wallet.findOne({userId});
            console.log('userId', userId);
            console.log('wallet:', wallet);
            console.log('wallet.balance:', wallet.balance)
           
            wallet.balance += parseFloat(amount) / 100;
            wallet.transactions.push({
                paymentStatus: 'Success',
                whichTransaction: 'Creadit',
                transactionAmount:  parseFloat(amount) / 100,
            })
            await wallet.save();

           return res.status(200).json(
                {
                    success: true,  message: 'Payment Verifed successfully.'
                }
            )
        } else {

       
            const wallet = await Wallet.findOne({userId});
            console.log('wallet:', wallet)
            if(wallet){
            wallet.transactions.push({
                paymentStatus: 'Failed',
                whichTransaction: 'Creadit',
                transactionAmount: 0,
            })
            await wallet.save();
        }

           return  res.status(404).json(
                { success: false, message: 'Invalid signature...🤦‍♂️' }
            );
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
}


const failePayment = async (req, res) => {
    try {
      const {amount} = req.body;
      const userId = req.session.userId;
        let ok  = 200;
        let pageNotFount = 404;
        let indernalServeError = 500;
      const wallet = await Wallet.findOne({userId});
      
      if(wallet){
        wallet.transactions.push({
            transactionAmount: amount,
            paymentStatus: 'Failed',
            whichTransaction: 'Creadit'
        })
        await wallet.save();
      }
       
      return res.status(ok).json({success: true, message: 'The payment failure status is updated...'})
    } catch (error) {
        let indernalServeError = 500;
        console.log('faildPayment:', error);
        res.status(indernalServeError).json({success: false, message: 'Internal server error'});
    }
}

module.exports = {
    createRazorpayOrder,
    orderSuccessPage,
    verifyPayment,
    retryPayment,
    addMoneyWallet,
    walletVerifyPayment,
    failePayment

}