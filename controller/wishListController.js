const Product = require('../model/Admin/productSchema');
const Cart = require('../model/user/cartSchema');
const WishList = require('../model/user/wishlistSchema');

const getWishList = async (req, res) => {
  try {
      const userId = req.session.userId;
      const wishList = await WishList.findOne({ userId }).populate('products.productId');
      const cart = await Cart.findOne({ userId });

      const cartProductIds = cart ? cart.products.map(product => product.productId.toString()) : [];

      if (!wishList || wishList.products.length < 1) {
          return res.render('wishlist', {
              products: [],
              cartProductIds: []
          });
      }

      res.render('wishlist', {
          products: wishList.products,
          cartProductIds: cartProductIds,
      });
  } catch (error) {
      console.log('getWishList:', error);
  }
};

const addToCartDirectInWishList = async (req, res) => {
    try {
      const productId = req.body.productId;
      const userId = req.session.userId;
      const quantity = req.body.quantity 
      const totalPrice = req.body.totalPrice;
      // console.log('quantity:', quantity);
      if (!userId) {
        return res.redirect('/login');
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
     
  
      let cart = await Cart.findOne({ userId: userId });
  
      if (cart) {
        const exitingItemIndex = cart.products.findIndex(
          product => product.productId.toString() === productId
        );
  
        if (exitingItemIndex >= 0) {
          const exitingQuantity = cart.products[exitingItemIndex].quantity;
          // console.log(cart.products[exitingItemIndex].quantity)
  
          if (exitingQuantity + quantity <= 5) {
            cart.products[exitingItemIndex].quantity += quantity;
            cart.products[exitingItemIndex].totalPrice += totalPrice ;
          } 
        } else {
          cart.products.push({
            productId: productId,
            quantity: quantity,
            totalPrice: totalPrice ,
          });
        }
      } else {
        cart = new Cart({
          userId: userId,
          products: [
            { productId: productId, quantity: quantity, totalPrice: totalPrice  },
          ],
        });
      }
  
      await cart.save();
      res.redirect('/wishlist-page');
  
    } catch (error) {
      console.log('addToCartDirect:', error);
      res.status(500).send('Internal server Error...');
    }
  }

const addWhishListProduct = async (req, res) => {
    try {
       const userId = req.session.userId;
       const {productId} = req.body;
      //  console.log('userId:', userId);
      //  console.log('productId:', productId);

       let wishList = await WishList.findOne({userId});
      //  console.log('wislist:', wishList)
        
       if(!wishList ){
            wishList = new WishList({
                userId: userId,
                products:[
                    {
                        productId: productId
                    }
                ]
            })
       }else{
        const productExists = wishList.products.some(
            (product) => product.productId.toString() === productId
        )

        if(productExists){
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist...',
                redirecturl: '/wishlist-page'
            });
        }

        wishList.products.push({productId})
       }
       await wishList.save();

       res.status(200).json({success: true, message:'Product added to wishlist'})
       
    } catch (error) {
        console.log('addWhishListProduct:', error);
        res.status(500).json({success: false, message: 'Internal Server error...'})
    }
}

const removeProductInWishlist = async (req, res) => {
    try {
        const {productId} = req.body;
        const userId = req.session.userId;
        
        const wishList = await WishList.findOne({userId});

        if(!wishList){
            return res.json({success: false, message: 'wishlist is not Fount...'});
        }
       
        wishList.products = wishList.products.filter(product => {
            return product.productId.toString() !== productId 
        })

        await wishList.save();

        res.json({success: true, message:'Product Remove fromo wishList...'});
        
        
    } catch (error) {
        console.log('removeProductInWishlist:', error);
        res.status(500).json({success: true, message: 'Internal Server Error...'});
    }
}

module.exports = {
    getWishList,
    addWhishListProduct,
    addToCartDirectInWishList,
    removeProductInWishlist
}