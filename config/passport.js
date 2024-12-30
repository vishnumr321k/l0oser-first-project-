const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/user/UserSchema');
const env = require('dotenv').config();
passport.use(
    new GoogleStrategy({
        clientID: process.env.Google_Client_Id,
        clientSecret: process.env.Google_Client_Secret,
        callbackURL: process.env.CallBack_URL
    },
        async (accessToken, refrenshtoken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (user) {
                    console.log('User already exits', user);
                    return done(null, user);
                } else {
                    user = new User({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null

                    });
                    console.log('Creating new user:', user);
                    await user.save();
                    return done(null, user);
                }
            } catch (error) {
                console.log('Error during user creation:', error);
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    console.log('Serializing user', user);
    done(null, user.id);
});


passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            console.log('Deerializing user:', user);
            done(null, user);
        })
        .catch(error => {
            done(error, null);
        })
})

module.exports = passport