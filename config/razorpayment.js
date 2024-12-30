const RazorPay = require('razorpay');
const env = require('dotenv').config();

const razorPaymetCopy = new RazorPay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
}) 


module.exports = razorPaymetCopy;