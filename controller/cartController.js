const Cart = require('../model/user/cartSchema');
const Product = require('../model/Admin/productSchema');
const User = require('../model/user/UserSchema');



// const getCartPage = async (req, res) => {
//     try {
//       const userId = req.session.userId;
        

//       const cart = await Cart.findOne({ userId }).populate("products.productId");
  
    
//       if (!cart || cart.products.length === 0) {
//         return res.render("user-cart", {
//           cart: null,
//           totalAmount: 0,
//           message: "Your cart is empty!",
//         });
//       }
  
      
//       const totalAmount = cart.products.reduce((total, item) => {
//         const salePrice = item.productId.salePrice || item.productId.regularPrice; // Use salePrice if available, else regularPrice
//         return total + salePrice * item.quantity;
//       }, 0);
  
     
//       res.render("user-cart", {
//         cart: cart.products.map((item) => ({
//           productId: item.productId._id,
//           productName: item.productId.productName,
//           description: item.productId.description,
//           salePrice: item.productId.salePrice || item.productId.regularPrice,
//           productImage: item.productId.productImage,
//           quantity: item.quantity,
//           subtotal: (item.productId.salePrice || item.productId.regularPrice) * item.quantity,
//         })),
//         totalAmount,
//         message: null,
//       });
//     } catch (error) {
//       console.error("Error fetching cart page:", error);
//       res.status(500).send("Internal Server Error");
//     }
//   };

const addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.userId;
    const quantity = parseInt(req.body.quantity, 10); 

    if (!userId) {
      return res.redirect('/login');
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const totalAmount = product.salePrice || product.regularPrice;

    let cart = await Cart.findOne({ userId: userId });

    if (cart) {
      const exitingItemIndex = cart.products.findIndex(
        product => product.productId.toString() === productId
      );

      if (exitingItemIndex >= 0) {
        const exitingQuantity = cart.products[exitingItemIndex].quantity;

        if (exitingQuantity + quantity <= 5) {
          cart.products[exitingItemIndex].quantity += quantity;
          cart.products[exitingItemIndex].totalPrice += totalAmount * quantity;
        } else {
          return res.status(400).json({ message: 'Cannot exceed 5 items per product' });
        }
      } else {
        cart.products.push({
          productId: productId,
          quantity: quantity,
          totalPrice: totalAmount * quantity,
        });
      }
    } else {
      cart = new Cart({
        userId: userId,
        products: [
          { productId: productId, quantity: quantity, totalPrice: totalAmount * quantity },
        ],
      });
    }

    await cart.save();
    res.redirect('/user-cart');
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
};



const getUserCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect('/login');
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect('/login');
    }

    const cartProduct = await Cart.findOne({ userId: userId }).populate('products.productId');

    
    
    // console.log('CartProduct:',cartProduct)
   
    if (!cartProduct ) {
      return res.render('user-cart', {
        user,
        cartProduct: null ,
        totalAmount: 0,
        message: 'Your cart is empty!',
        products:[]
      });
    }

    const totalAmount = cartProduct.products.reduce(
      (sum, product) => sum + (product.totalPrice || 0),
      0
    );

    res.render('user-cart', {
      user,
      cartProduct,
      totalAmount,
      
    });
  } catch (error) {
    console.error('Error in getUserCart:', error);
    res.status(500).send('An error occurred while loading your cart.');
  }
};


const removeCartItem = async (req, res) => {
  try {
      const userId = req.session.userId;
      const { productId } = req.body;

     
      const cart = await Cart.findOneAndUpdate(
          { userId },
          { $pull: { products: { productId } } },
          { new: true } 
      );

      if (cart) {
          const updatedTotal = cart.products.reduce((total, item) => total + item.totalPrice, 0);
          return res.json({ success: true, updatedTotal });
      } else {
          return res.json({ success: false, message: 'Item not found in cart.' });
      }
  } catch (error) {
      console.error('Error removing item from cart:', error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};


const updateQuantity = async (req, res) => {
  try {
      const userId = req.session.userId;
      const { productId, change } = req.body;

      if (!userId) {
          return res.status(400).json({ success: false, message: 'User not logged in.' });
      }

      // console.log('userId:', userId);
      // console.log('{ productId, change }:', { productId, change });

      
      const cart = await Cart.findOne({ userId }).populate('products.productId');
      // console.log('cart:', cart);

      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart not found.' });
      }

      const product = cart.products.find(item => item.productId._id.toString() === productId);
      // console.log('product:', product);

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found in cart.' });
      }

   
      product.quantity += change;
      if (product.quantity < 1) product.quantity = 1;
      if (product.quantity > 5) {
        product.quantity = 5;
        await cart.save();
        return res.status(500).json({success: false, message:'You reached Maximum quantity. Only 5 product...'})
      }
      const price = product.productId.salePrice || product.productId.regularPrice || 0;
      if (isNaN(price)) {
          return res.status(500).json({ success: false, message: 'Invalid price data for product.' });
      }

      product.totalPrice = product.quantity * price;

      await cart.save();

      const updatedCartTotal = cart.products.reduce((total, item) => total + item.totalPrice, 0);

      return res.json({
          success: true,
          updatedQuantity: product.quantity,
          updatedTotalPrice: product.totalPrice,
          updatedCartTotal,
      });
  } catch (error) {
      console.error('Error updating cart quantity:', error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};


const addToCartDirect = async (req, res) => {
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
    res.redirect('/product-list');

  } catch (error) {
    console.log('addToCartDirect:', error);
    res.status(500).send('Internal server Error...');
  }
}




  module.exports = {
    getUserCart,
    addToCart,
    removeCartItem,
    updateQuantity,
    addToCartDirect
  }
