const User = require('../model/user/UserSchema');
const bcrypt = require('bcryptjs');
const otpGenerator = require('otp-generator');
const nodeMailer = require('../helpers/nodemailer');
const Category = require('../model/Admin/categorySchema');
const Product = require('../model/Admin/productSchema');
const Address = require('../model/user/addressSchema');
const Cart = require('../model/user/cartSchema');
const Order = require('../model/user/orderSchema');
const { json } = require('body-parser');
const Wallet = require('../model/user/walletSchema');





let otpStore = {};


const generateOtp = () => {
    return otpGenerator.generate(6, { upperCase: false, specialChars: false, digits: true });
};

const sendOtp = async (email, otp) => {
    try {
        console.log(`Sending OTP to: ${email}, OTP: ${otp}`);
        const isSent = await nodeMailer(email, otp);
        if (!isSent){
            console.log('Failed to send OTP');
        }
    } catch (error) {
        console.error('Error sending OTP:', error.message);
    }
};

const loadLogin = async (req, res) => {
    try {
        const user = req.session.userId;
        const passErr = req.query.passErr || ''; 

        if (user) {
            res.redirect('/home');
        } else {
            // console.log('The login page is loaded...🕺');
            res.render('login', { error: null, passErr });
        }
    } catch (error) {
        console.log('The login page is not loaded...😒', error);
        res.status(404).send('Page not found...');
    }
};


const loadSignup = async (req, res) => {
    try {
        // console.log('The Sign up page is loaded...🕺🕺');
        res.render('signup', { error: null });
    } catch (error) {
        console.log('The signup page is note loaded Error', error);
        res.status(404).send('The page note Found...😶‍🌫️');
    }
};

const loadHomepage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const google = req.session.googleId;

    
        if (userId) {
            const user = await User.findById(userId);
            if (user.isBlocked) {
                req.session.destroy();
                return res.redirect('/login?passErr=Your account has been blocked.');
            }
        }

        if (google) {
            const googleUser = await User.findOne({ googleId: google });
            if (googleUser.isBlocked) {
                req.session.destroy();
                return res.redirect('/login?passErr=Your account has been blocked.');
            }
        }

        const gouser = await User.findOne({ googleId: google });
        // console.log(gouser);

        let googleUser = null;
        if (gouser) {
            googleUser = gouser._id;
            // console.log(googleUser);
        }

        
        let wallet = await Wallet.findOne({ userId: userId || googleUser });
        if (!wallet && (userId || googleUser)) {
            
            const newWallet = new Wallet({
                userId: userId || googleUser,
                balance: 0,
                transactions: []
            });
            wallet = await newWallet.save();
        }

       
        const categories = await Category.find({});
        const productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });

        let userData = null;
        let googleData = null;

        if (userId) {
            userData = await User.findById(userId);
        } else if (google) {
            googleData = await User.findOne({ googleId: google });
        }

        let productCount = 0;
        const cart = await Cart.findOne({ userId: userId || googleUser });
        if (cart) {
            productCount = cart.products.length;
        }

        res.render('home', {
            users: userData,
            products: productData,
            google: googleData,
            productCount,
            wallet: wallet 
        });

    } catch (error) {
        console.log('Error loading homepage:', error);
        res.status(404).send('Page not found...😶‍🌫️');
    }
};

const userSignup = async (req, res) => {
    const { name, email, password, cpassword, mobile } = req.body;
    try {
        if (!name || !email || !password || !cpassword || !mobile) {
            return res.status(400).render('signup', { error: 'All fields are required' });
        }
        if (password !== cpassword) {
            return res.status(400).render('signup', { error: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('signup', { error: 'Email already exists' });
        }

        const otp = generateOtp();
        const otpExpiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes validity
        otpStore[email] = { otp, otpExpiryTime, password, mobile, name };

        await sendOtp(email, otp);
        res.render('otp-verification', { email, error: null, message: null });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('Server error');
    }
};

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    // console.log(email)
    const storedOtpData = otpStore[email];
    if (!storedOtpData || Date.now() > storedOtpData.otpExpiryTime) {
        return res.status(400).render('otp-verification', { message: 'OTP expired' });
    }

    if (otp !== storedOtpData.otp) {
        return res.status(400).render('otp-verification', { message: 'Invalid OTP' });
    }
    // console.log(storedOtpData.name)
    try {
        const passwordHash = await bcrypt.hash(storedOtpData.password, 10);
        const newUser = new User({
            name: storedOtpData.name,
            email,
            password: passwordHash,
            mobile: storedOtpData.mobile,
        });
        await newUser.save();
        delete otpStore[email];
        res.render('signup-success', { name: storedOtpData.name, email });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).send('Server error');
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).render('otp-verification', {
                error: 'Email is required',
                message: null,
                otpExpiryTime: null,
                mobile: null,
                email: email,
                name: null
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // console.log('User not found for email:', email); // Log user not found
            return res.status(404).render('otp-verification', {
                error: 'User not found',
                message: null,
                otpExpiryTime: null,
                mobile: null,
                email: email,
                name: null
            });
        }

        const { mobile, name } = user;
        const otp = generatorOtp();
        const otpExpiryTime = Date.now() + 90 * 1000;
        otpStore[email] = { otp, otpExpiryTime, password: otpStore[email]?.password, mobile, name };

        await sendOtp(email, otp);

        return res.status(200).render('otp-verification', { email, error: null, message: 'OTP resent successfully', otpExpiryTime, mobile, name });


    } catch (error) {
        console.log('Error during OTP resend:', error);
        return res.status(500).send('Server error. Please try again later...');
    }

}

const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).render('login', {
                error: 'All fields are required',
                passErr: ''
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).render('login', {
                error: null,
                passErr: 'Invalid email or password'
            });
        }

        if (user.isBlocked) {
            return res.status(403).render('login', {
                error: 'Your account has been blocked. Please contact support.',
                passErr: ''
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).redirect(`/login?passErr=Invalid email or password`);
        }

        req.session.userId = user._id;
        return res.status(200).redirect('/home');
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).render('login', {
            error: 'An unexpected error occurred',
            passErr: ''
        });
    }
};


const userLogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                // console.log('Error destroying the section...');
                return res.status(500).send('Error loging out');
            }
            res.clearCookie('connect.sid');
            // console.log('User Loged Out sussessfully');
            res.redirect('/login');
        })
    } catch (error) {
        console.log('Error during logout', error);
        res.status(500).send('Internal Server error');
    }
}

const getProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
      
        if(!userId){
            return res.redirect('/login');
        }
        // console.log(userId)
        const user = await User.findById(userId);
        const cart = await Cart.findOne({userId});
        const orders = await Order.find({userId: userId}).sort({lastUpdate: -1});
        // console.log('Order:', orders);
       
        let productCount = cart ? cart.products.length : 0;

        if (!user) {
            return res.status(404).send('page not Found');
        }
        

        // console.log('The user profile is loaded...😍');
        res.render('userProfile', { user , productCount, orders});
    } catch (error) {
        console.log('The error in user getprofile:', error);

    }
}



const updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, mobile } = req.body;

        const updateprofile = await User.findByIdAndUpdate(userId,
            { name, mobile },
            { new: true }
        )

        if (!updateprofile) {
            return res.status(404).send('Page not found...');
        }

        res.status(200).json({ message: 'Profile update Successfully...' });
    } catch (error) {
        console.log('The updateProfile', error);
        res.status(500).send('Internal Server...');
    }
}


const addAddress = async (req, res) => {
    try {
        // console.log('dsnf')
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('Page not Found...');
        }
        console.log('The add-address is loaded...');
        res.render('add-address', { user });
    } catch (error) {
        console.log('The addaddress:', error);
        res.status(500).send('Internal Server Error...');
    }
}


const addAddressDate = async (req, res) => {
    try {
        const { addressType, Username, state, city, streetAddress, pincode, mobile, altMobile } = req.body;
        // console.log(req.body)
        const userId = req.session.userId;

        let errors = [];
        if(addressType.trim() === ''){
            errors.push('Address Type not Selected...');
        }
        if(Username.trim() === ''){
            errors.push('Name is required...');
        }
        if(state.trim() === ''){
            errors.push('State is required...');
        } 
        if(city.trim() === ''){
            errors.push('City is required...')
        }
        if(streetAddress.trim() === ''){
            errors.push('Street Address is required...')
        }
        if(!/^\d{6}$/.test(pincode)){
            errors.push('Pincode must 6 digit number...');
        }
        if(!/^\d{10}$/.test(mobile)){
            errors.push('Phone number must 10 digit number..')
        }
        if(!/^\d{10}$/.test(altMobile)){
            errors.push('Alternate number must be 10 digit...');
        }
        if(errors.length > 0){
            return res.status(400).json({errors});
        }
        // console.log(errors)
        const newAddress = new Address({
            userId: userId,
            addressType: addressType,
            Username: Username,
            state: state,
            city: city,
            streetAddress: streetAddress,
            pincode: pincode,
            mobile: mobile,
            altMobile: altMobile
        })

        await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    addresses: {
                        addressType,
                        name: Username,
                        state,
                        city,
                        streetAddress,
                        pincode,
                        mobile,
                        altMobile,
                    },
                },
            },
            { new: true } 
        );

        await newAddress.save();
        res.status(200).json({ success: true })
    } catch (error) {
        console.log('Error adding Address', error);
        res.status(500).json({ error: 'Internal Server Error...' });
    }
}

const loadEditAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        const addressId = req.query.addressId;
        // console.log(addressId)
        if (!userId) {
            return res.status(404).send('Page Not Found..🤨');
        }

       
        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(404).send('User not found.');
        }

    
        const selectedAddress = user.addresses.find(
            (address) => address._id.toString() === addressId
        );

        if (!selectedAddress) {
            return res.status(404).send('Address not found.');
        }

        // console.log('Selected Address:', selectedAddress);

        
        res.render('edit-address', { address: selectedAddress, userId });
    } catch (error) {
        console.log('editAddress:', error);
        res.status(500).send('Internal Server Error');
    }
};


const editAddress = async (req, res) => {
    try {
        const { addressId, addressType, Username, state, city, streetAddress, pincode, mobile, altMobile } = req.body;

      
        const updatedUser = await User.findOneAndUpdate(
            { "addresses._id": addressId }, 
            {
                $set: {
                    "addresses.$.addressType": addressType,
                    "addresses.$.name": Username,
                    "addresses.$.state": state,
                    "addresses.$.city": city,
                    "addresses.$.streetAddress": streetAddress,
                    "addresses.$.pincode": pincode,
                    "addresses.$.mobile": mobile,
                    "addresses.$.altMobile": altMobile,
                },
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Address not found." });
        }

        res.status(200).json({ message: "Address updated successfully." });
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};


const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.body; 
        const userId = req.session.userId; 

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

       
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { addresses: { _id: addressId } } }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User or address not found" });
        }

        res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const orderList = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orders = await Order.findById(userId);
        
    } catch (error) {
        
    }
}

const updatePasswordInProfile = async (req, res) => {
    try {
        const userId = req.session.userId;

        
        
        if(!userId){
            return res.redirect('/login');
        }

        const { currentPassword, newPassword } = req.body;

        console.log('Received:', { currentPassword, newPassword });

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        console.log("isMatch:", isMatch)
        if (!isMatch) {
            console.log('Current password does not match:', currentPassword);
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        console.log('Password updated successfully');
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in updatePasswordInProfile:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const aboutPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if(!userId){
            return res.redirect('/login');
        }
        // console.log('About Page is loaded');
        res.render('aboutPage');
    } catch (error) {
        console.log('aboutPage:', error);
    }
}

const contactDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if(!userId){
            return res.redirect('/login');
        }
        // console.log('About Page is loaded');
        res.render('contactPage');
    } catch (error) {
        console.log('aboutPage:', error);
    }
}

const error404page = async (req, res) => {
    try {
        res.render('404');
    } catch (error) {
        console.log('error404page:', error);
    }
}

module.exports = {
    loadLogin,
    loadSignup,
    loadHomepage,
    userSignup,
    userLogin,
    userLogout,
    resendOtp,
    verifyOtp,
    getProfile,
    updateProfile,
    addAddress,
    addAddressDate,
    loadEditAddress,
    editAddress,
    deleteAddress,
    orderList,
    updatePasswordInProfile,
    aboutPage,
    contactDetails,
    error404page
}