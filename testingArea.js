// const mongoose = require("mongoose");
// const Admin = require("./models/adminModel"); // Path to your admin schema model

// const mongoURI = "mongodb://127.0.0.1:27017/l0oser_Data_Base";

// const connectDb = async () => {
//   try {
//     await mongoose.connect(mongoURI);
//     console.log("Db Connected...");

//     // Check and add default admin if not exists
//     const existingAdmin = await Admin.findOne({ email: "admin@example.com" });
//     if (!existingAdmin) {
//       const admin = new Admin({
//         name: "Admin User",
//         email: "admin@example.com",
//         password: "admin123", // Hash this in production!
//       });
//       await admin.save();
//       console.log("Default admin created successfully!");
//     } else {
//       console.log("Admin already exists!");
//     }
//   } catch (error) {
//     console.log(`DB Connect Failed ${error}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDb;

// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;
    
//     const user = users.find(u => u.username === username);
    
//     if (user && await bcrypt.compare(password, user.password)) {
//         req.session.isAuthenticated = true;
//         req.session.username = username;
//         res.redirect('/home');
//     } else {
//         res.render('login', { error: 'Invalid username or password' });
//     }
// });

// app.use(session({
//     secret:process.env.SESSION_SECRET,
//     resave:false,
//     saveUninitialized:true,
//     cookie:{
//         secure:false,
//         httpOnly:true,
//         maxAge:72*60*60*1000
//     }
// }))

// app.use((req, res, next) => {
//     res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//     res.set('Pragma', 'no-cache');
//     res.set('Expires', '0');
//     next();
// })



