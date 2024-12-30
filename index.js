const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const nocache =  require('nocache');
const adminRouter = require('./routes/adminRoute');
const userRouter = require('./routes/userRouter');
const connectDb = require('./config/dataBase');
const passport = require('./config/passport');


const env = require('dotenv');
const { fetchCartProductCount , wishlistAddProductCount} = require('./middleware/countCartProduct');

env.config();
connectDb()
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 72 * 60 * 60 * 1000
    }
}));





app.use(express.static(path.join(__dirname, 'public')));
app.use( '/uploads',express.static(path.join(__dirname, 'public/uploads')));
app.use(fetchCartProductCount)
app.use(wishlistAddProductCount)

app.set('view engine', 'ejs');
app.set("views", [
    path.join(__dirname, 'views', 'Admin'),
    path.join(__dirname, 'views', 'user')
]);

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use('/admin', adminRouter);
app.use('/', userRouter);


app.use(passport.initialize());
app.use(passport.session());




module.exports = app