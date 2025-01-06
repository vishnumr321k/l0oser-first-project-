const Category = require('../../model/Admin/categorySchema');
const Product = require('../../model/Admin/productSchema');
const Review = require('../../model/Admin/ReviewSchema');
const Cart = require('../../model/user/cartSchema');



const getProductList = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.userId
        
        if(!userId){
            return res.redirect('/login');
        }

        const product = await Product.findById(productId).populate('category','name');
        const recomCat = product.category;
        const recomProducts = await Product.find({category:recomCat});
        const cart = await Cart.findOne({userId});
        
       if(!product){
        return res.status(404).send('Page not found..');
       }
        
       res.render('productDetails', {
        product,
        recomProducts,
        productId,
        
    });
       
    } catch (error) {
        console.log(error);
        res.status(500).send('Erro fetching product details...');   
    }
}
 




module.exports = {
    getProductList,
   
}