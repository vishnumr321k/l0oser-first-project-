const express = require('express');
const app = express();
const path = require('path');

const adminRouter = require('./routes/adminRoute');
const connectDb = require('./config/dataBase');

connectDb();


app.use(express.json());
app.use(express.urlencoded({ extended:true }));



app.set('view engine', 'ejs');
app.set("views", [
    path.join(__dirname, 'views', 'Admin'),
    path.join(__dirname, 'views', 'user')
]);



app.use('/admin', adminRouter);

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app