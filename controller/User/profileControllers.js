const User = require('../../model/user/UserSchema');
const nodeMailer = require('../../helpers/nodemailer'); // Ensure proper helper is used
const bcrypt = require('bcryptjs');

function generatorOtp() {
    const digits = '1234567890';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}


const forgotPassPage = async (req, res) => {
    try {
        res.render('forgot-password');
    } catch (error) {
        console.log(error);
        res.status(500).send('An Error Occurred.');
    }
};


const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });

        if (!findUser) {
            return res.json({ success: false, message: 'Email not registered.' });
        }

        const otp = generatorOtp();


        req.session.userOtp = otp;
        req.session.email = email;
        req.session.otpTimestamp = Date.now();

        console.log('Session after storing OTP:', {
            email: req.session.email,
            otp: req.session.userOtp,
            timestamp: req.session.otpTimestamp
        });

        const emailSent = await nodeMailer(email, otp, 'Password Reset Request', 'Your OTP for resetting your password is:');

        if (!emailSent) {
            return res.json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }


        res.render('forgot-password-otp');

    } catch (error) {
        console.error('Error in forgotEmailValid:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request.'
        });
    }
};




const getotp = async (req, res) => {
    try {
        res.render('forgot-password-otp', { message: "" });
    } catch (error) {
        console.log(error);
    }
};

const verifyOtpAndRedirect = async (req, res) => {
    try {
        const otp = req.body.otp;
        console.log(req.body)
        console.log("otp", otp)
        console.log('Verification attempt:', {
            receivedOtp: otp,
            sessionOtp: req.session.userOtp,
            sessionEmail: req.session.email,
            timestamp: req.session.otpTimestamp
        });


        if (!req.session.userOtp || !req.session.email) {
            return res.status(400).json({
                success: false,
                message: 'Session expired. Please restart the password reset process.'
            });
        }


        const otpAge = Date.now() - req.session.otpTimestamp;
        if (otpAge > 15 * 60 * 1000) {

            delete req.session.userOtp;
            delete req.session.otpTimestamp;

            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }


        const sessionOtp = req.session.userOtp;
        const submittedOtp = String(otp);

        if (!submittedOtp || submittedOtp !== sessionOtp) {
            console.log('OTP mismatch:', {
                submitted: submittedOtp,
                session: sessionOtp
            });

            return res.status(400).render('forgot-password-otp',
                { message: 'Invalid OTP' }
            );
        }


        req.session.otpVerified = true;


        res.render('new-password', { email: req.session.email });

    } catch (error) {
        console.error('Error in verifyOtpAndRedirect:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while verifying the OTP.'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const email = req.session.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Session expired. Please restart the password reset process.'
            });
        }

        const otp = generatorOtp();
        req.session.userOtp = otp;
        req.session.otpTimestamp = Date.now();

        const emailSent = await nodeMailer(email, otp, 'Password Reset Request', 'Your new OTP for resetting your password is:');

        if (emailSent) {
            res.json({
                success: true,
                message: 'New OTP sent successfully.'
            });
        } else {
            res.json({
                success: false,
                message: 'Failed to send new OTP. Please try again.'
            });
        }

    } catch (error) {
        console.error('Error in resendOtp:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while resending the OTP.'
        });
    }
};


const saveNewPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body
    try {
        const findEmail = req.session.email;
        if (!newPassword || !confirmPassword) {
            return res.status(400).render('login', { error: 'All fields are required' });
        }



        const user = await User.findOne({ email: findEmail });
        if (!user) {
            return res.status(401).render('login', { error: 'Invalid email or password' });
        }

        const hashePassword = await bcrypt.hash(newPassword, 10);

        user.password = hashePassword;
        await user.save();

        req.session.destroy();
        return res.render('forgotPasswordSuccess');

    } catch (error) {
        console.log(error);
        res.status('And Error find');
    }
}

module.exports = {
    forgotPassPage,
    forgotEmailValid,
    getotp,
    verifyOtpAndRedirect,
    resetPassword,
    saveNewPassword

};
