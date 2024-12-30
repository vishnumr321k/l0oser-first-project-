const nodemailer = require('nodemailer');

const sendMail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'vishnumr321k@gmail.com',
                pass: 'skta aalm olhp kjdz',
            },
        });

        const mailOptions = {
            from: 'vishnumr321k@gmail.com',
            to: email,
            subject: 'Email Verification',
            html: `<p>Hi, your OTP for signup is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = sendMail;
