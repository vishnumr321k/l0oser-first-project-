const nodemailer = require('nodemailer');

const nodeMailer = async (email, otp) =>{
    try {
        const http = require('http');

        const agent = new http.Agent({
            rejectUnauthorized: false,
        });

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
              user: 'vishnumr321k@gmail.com',
              pass: 'skta aalm olhp kjdz',
            },
            tls: {
              rejectUnauthorized: false, 
            },
            agent, // Pass the agent to nodemailer
          });

          const mailOptions = {
            from: 'vishnumr321kk@gmail.com',
            to: email,
            subject: 'Verification Mail',
            html: `<p>Hi, your OTP for signing up is: ${otp}</p>`
          };
          const sendMailPromise = new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error); // Reject the promise if email fails to send
                } else {
                    console.log('Email sent:', info.response);
                    resolve(info); // Resolve the promise if email is sent successfully
                }
            });
        });
 await sendMailPromise
        //Indicate success
        return true;
    } catch (error) {
        console.log(error.message);
        return false;//Indicate failure
    }
};

module.exports = nodeMailer;