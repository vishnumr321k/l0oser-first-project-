const Admin = require('../model/Admin/AdminSchema');
const bcrypt = require('bcryptjs');
const User = require('../model/user/UserSchema');
const Product = require('../model/Admin/productSchema');
const Order = require('../model/user/orderSchema');





const serverChecking = async(req, res) =>{
    try {
        res.send('The server is success');
    } catch (error) {
        console.log(error)
        res.status(404).send('The page not fount');
    }
}


const loadSignin = async (req, res) => {
    try {
        if(req.session.adminId){
            res.redirect("/admin/dashboard")
        }
        res.render('admin-login');
    } catch (error) {
        console.log(`The signin not loaded and error seen ${error}`);
        res.status(404).send('Page not Found');
    }
}
// Backend Controller Functions

const loadDasheBoard = async (req, res) => {
    try {
        const salesData = await getTotalSales();
        const products = await getMostSellingProducts();
        const categories = await getMostSellingCategories();
        const brands = await getMostSellingBrands();
        const orders = await Order.find({});
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const count = orders.length;
        const averageOrderValue = count > 0 ? (totalRevenue / count).toFixed(2) : 0;

        res.render('dashboard', {
            salesData,
            products,
            categories,
            brands,
            totalOrder: count,
            totalRevenue,
            averageOrderValue
        });
    } catch (error) {
        console.error('Dashboard loading error:', error);
        res.status(500).send('Internal Server Error');
    }
};

async function getTotalSales() {
    try {
        const totalSales = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSalesAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        // Weekly Sales
        const weeklySales = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startOfYear },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: { $week: "$orderDate" },
                    sales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Monthly Sales
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: startOfYear },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: { $month: "$orderDate" },
                    sales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Yearly Sales
        const yearlySales = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: { $year: "$orderDate" },
                    sales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 5 }
        ]);

        // Format data for charts
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Process weekly data
        const weeklyData = {
            labels: Array.from({ length: 52 }, (_, i) => `Week ${i + 1}`),
            data: Array(52).fill(0)
        };
        weeklySales.forEach(item => {
            if (item._id >= 0 && item._id < 52) {
                weeklyData.data[item._id] = item.sales;
            }
        });

        // Process monthly data
        const monthlyData = {
            labels: monthNames,
            data: Array(12).fill(0)
        };
        monthlySales.forEach(item => {
            monthlyData.data[item._id - 1] = item.sales;
        });

        // Process yearly data
        const yearlyData = {
            labels: yearlySales.map(item => item._id.toString()),
            data: yearlySales.map(item => item.sales)
        };

        return {
            totalSalesAmount: totalSales[0]?.totalSalesAmount || 0,
            weekly: weeklyData,
            monthly: monthlyData,
            yearly: yearlyData
        };
    } catch (error) {
        console.error("Error calculating sales data:", error);
        throw error;
    }
}

async function getMostSellingProducts() {
    try {
        const result = await Order.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.productId",
                    totalQuantitySold: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    _id: 1,
                    productName: "$productDetails.productName",
                    totalQuantitySold: 1
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 10 }
        ]);

        return result.map(item => ({
            ...item,
            _id: item._id.toString()
        }));
    } catch (error) {
        console.error("Error finding most selling products:", error);
        return [];
    }
}

async function getMostSellingCategories() {
    try {
        const result = await Order.aggregate([
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: "$categoryDetails._id",
                    categoryName: { $first: "$categoryDetails.name" },
                    totalQuantitySold: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 10 }
        ]);

        return result.map(item => ({
            ...item,
            _id: item._id.toString()
        }));
    } catch (error) {
        console.error("Error finding most selling categories:", error);
        return [];
    }
}

async function getMostSellingBrands() {
    try {
        const result = await Order.aggregate([
            // Unwind the products array to work with individual products
            { $unwind: "$products" },
            
            // Lookup product details
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },

            // Group by brand and calculate total quantity sold
            {
                $group: {
                    _id: "$productDetails.brand",
                    totalQuantitySold: { $sum: "$products.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
                }
            },

            // Filter out null or empty brand names
            {
                $match: {
                    "_id": { $ne: null, $ne: "" }
                }
            },

            // Sort by quantity sold in descending order
            { $sort: { totalQuantitySold: -1 } },

            // Limit to top 10 brands
            { $limit: 10 },

            // Project final format
            {
                $project: {
                    _id: 1,
                    brandName: "$_id",
                    totalQuantitySold: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // Convert ObjectIds to strings for frontend consumption
        return result.map(item => ({
            ...item,
            _id: item._id.toString()
        }));

    } catch (error) {
        console.error("Error finding most selling brands:", error);
        return [];
    }
}

const adminSignin = async(req, res) =>{
    const {email, password} = req.body;
    console.log({email, password});
    try {
        const admin = await Admin.findOne({email:email});
        console.log(admin)
        if(!admin){
            console.log("Admin not Found..🤦");
            return res.status(401).send('Authentication Failed...😎')
        }
      
        const is_Match = await bcrypt.compare(password, admin.password);

        if(!is_Match){
            console.log('Incorrect Password...🕺');
            return res.status(401).send('Authentication Failed...😒');
           
        }
        req.session.adminId =  admin._id;

        console.log("Admin Authetication Successfully...😁");
        return res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(`Error during sign-in: ${error}`);
        return res.status(500).send("Internal server error");
    }
}

const adminLogout = async(req, res) =>{
    try {
        req.session.destroy((err) =>{
            if(err){
                console.log('Error destroying Session',err);
                return res.status(500).send('Error logging out');            
                }
                res.clearCookie('connect.sid');
                console.log('Admin logged out successfully');
                res.redirect('/admin/signin');
            })
    } catch (error) {
        console.log('Error during logout',error);
        res.status(500).send('Internal Server error');
    }
}


const orderLists = async (req, res) => {
    try {

        const {orderSearch , status , page= 1, limit= 10} = req.query;

        const startingIndex = (page - 1) * limit;

        const totalOrder = await Order.countDocuments();

        let query = {};

        if(orderSearch){
            query = {
                $or:[
                    { orderId:{$regex:orderSearch, $options: 'i' }},
                    { 'userId.name': { $regex: orderSearch, $options: 'i' } },
                ]
            };
        }

        if(status){
            query.status = status;
        }
        

        const orders = await Order.find(query).populate('userId').populate('products.productId').sort({lastUpdate:-1}).skip(startingIndex).limit(Number(limit));
        

        console.log('The orderlist is loadede...🤩');
        res.render('order-list', 
            { 
                orders,
                currentPage: Number(page),
                totalPage: Math.ceil(totalOrder / limit),
                limit: Number(limit)
            }
        );
    } catch (error) {
        console.log('orderList:', error);
    }
}

const orderDetails = async (req, res) => {
    try {
        const {orderId} = req.query
       
        const orders = await Order.findOne({_id:orderId}).populate('userId').populate('products.productId').sort({orderDate:-1});

        
        console.log('The orderDeails loaded...');
        res.render('order-details', {orders});
    } catch (error) {
        console.log('orderDeails:', error);
    }
}

const InventorySection = async (req, res) =>{
    try {
        const {page = 1, limit= 3} = req.query;

        const statingIndex = (page - 1) * limit;

        const totalProducts = await Product.countDocuments();

        

        const products = await Product.find({}).populate('category').skip(statingIndex).limit(Number(limit));
        console.log('The inventory Loaded...😍');
        res.render('Inventory', 
            {
                products,
                currentPage: Number(page),
                totalPage: Math.ceil(totalProducts / limit),
                limit: Number(limit)
            }
        );
    } catch (error) {
        console.log('InventorySection:', error);
    }
}

const updateStock = async (req, res) => {
    try {
        const productId = req.body.productId;
        const quantity = req.body.quantity;
        console.log('productId:', productId)
        console.log('quantity:', quantity);
         
        await Product.findByIdAndUpdate(
            productId,
            {$set: 
                {quantity: quantity}
            },
            {new: true}
        )
        // console.log('productId:', productId)
        // console.log('quantity:', quantity);

        res.redirect('/admin/stock-management');
    } catch (error) {
        console.log('updateStock:', error);
    }
}


const updateOrderStatus = async (req, res) =>{
    try {
        const {orderId, orderStatus} = req.body;
        console.log(orderId, orderStatus);

        const order = await Order.findById(orderId)

        if(order.status === 'Cancelled'){
           res.status(404).send('The order is already cancellation...')

        }

        order.status = orderStatus
        order.lastUpdate = new Date();
        if(order.status === 'Deliverd'){
            order.products.forEach(product => {
                product.status = 'Deliverd'
            })
        }

       

        await order.save()
        return res.redirect(`/admin/order-details?orderId=${orderId}`);
        
         
    } catch (error) {
        console.log('updateOrderStatus:', error);
    }
}

const delateOrder = async (req, res) =>{
    try {
       
        const {orderId} = req.params;
        console.log('orderId:', orderId);

        if(!orderId){
            alert('There is no Order Id..🤨');
            console.log('There is an no Order id in the deleteOrder...🤦‍♂️')
        }

        const delatingOrder = await Order.findByIdAndDelete(orderId);

        if(!delatingOrder){
            alert('There is an issue delatingOrder ..🤨');
            console.log('There is an issue delatingOrde  in the deleteOrder...🤦‍♂️')
        }

        res.status(200).send('Deleation conpleated...')
        
    } catch (error) {
        console.log('deleteOrder:', error)
    }
}

module.exports ={
    serverChecking,
    loadSignin,
    loadDasheBoard,
    adminSignin,
    adminLogout,
    orderLists,
    orderDetails,
    InventorySection,
    updateStock,
    updateOrderStatus,
    delateOrder
};
