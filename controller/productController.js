const Product = require('../model/Admin/productSchema');
const Category = require('../model/Admin/categorySchema');
const Brand = require('../model/Admin/brandSchema');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Address = require('../model/user/addressSchema');
const Cart = require('../model/user/cartSchema');
const User = require('../model/user/UserSchema');
const Order = require('../model/user/orderSchema');
const orderId = require('shortid');
const Wallet = require('../model/user/walletSchema');
const PDFDocument = require('pdfkit');
const { application } = require('express');






const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        res.render('product-add', {
            cat: category,
            brand: brand
        });
    } catch (error) {
        console.error("Error fetching categories and brands:", error);
        res.status(500).render('page-error', { message: "Failed to load categories and brands" });
    }
};

const addProducts = async (req, res) => {
    try {
      const products = req.body;
      const productExists = await Product.findOne({
        productName: products.productName,
      });
  
      if (!productExists) {
        const images = [];
        const allowedImages = ["jpeg", "jpg", "png"];
       
        if (req.files && req.files.length > 0) {
          for (let i = 0; i < req.files.length; i++) {
            const fileExtension = path.extname(req.files[i].originalname) 
              .toLowerCase()
              .replace(".", "");
  
            if (!allowedImages.includes(fileExtension)) {
              return res
                .status(409)
                .json(`Unsupported image format: ${req.files[i].originalname}`);
            }
  
          
            const originalImagePath = req.files[i].path;
            const resizedImagePath = path.join("public", "uploads", "product-images", req.files[i].filename);
  
            await sharp(originalImagePath)
              .resize({ width: 440, height: 440 })
              .toFile(resizedImagePath);
  
            images.push(req.files[i].filename);
          }
        }
  
        const categoryId = await Category.findOne({ name: products.category });
  
        if (!categoryId) {
          return res.status(400).json("Invalid category name");
        }
  
        const newProduct = new Product({
          productName: products.productName,
          description: products.description,
          brand: products.brand,
          category: categoryId._id,
          regularPrice: products.regularPrice,
          salePrice: products.salePrice,
          createdAt: new Date(),
          quantity: products.quantity,
          size: products.size,
          color: products.color,
          productImage: images,
          status: "Available",
        });
  
        await newProduct.save();
        return res.redirect("/admin/addproduct");
      } else {
        return res
          .status(400)
          .json("Product already exists, please try with another name");
      }
    } catch (error) {
      console.error("Error adding product", error);
      res.status(500).send("Internal Server Error");
    }
  };
  

const getAllProducts = async (req, res) =>{
    try {
        const search = req.query.search ||  '';
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        
        const productData = await Product.find({
            $or:[
                {productName:{$regex:new RegExp('.*'+ search +'.*','i')}},
                {brand:{$regex:new RegExp('.*'+ search +'.*','i')}}
            ], 
        }) .populate('category')
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await Product.find({
            $or:[
                {productName:{$regex: new RegExp('.*' + search + '.*','i')}},
                {brand:{$regex:new RegExp('.*'+search+'.*','i')}}
            ],
        }).countDocuments();

        const categories = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false});

        if(categories && brand){
            res.render('products',{
                data:productData,
                currentPage: page,
                totalPages:Math.ceil(count/limit),
                cat:categories,
                brand: brand
            })
        }else{
            res.send('404');
        }
    } catch (error) {
        console.log('The page not found',error);
        res.send('page not found');
    }
}
 

const addProductOffer = async (req, res) => {
    try {
        const {productId, percentage} = req.body;
        
        const findProduct = await Product.findOne({_id:productId});
        
        const findCategory = await Category.findOne({_id:findProduct.category});
        if(findCategory.categoryOffer > percentage){
            return res.json({status:false, message:'This Product category already has a category Offer'})
        }

        findProduct.salePrice = Math.floor(findProduct.regularPrice - (findProduct.regularPrice * (percentage / 100)));
        console.log("per",percentage)
        findProduct.productOffer = parseInt(percentage);
        await findProduct.save();
        console.log("product data",findProduct)
        findCategory.categoryOffer = 0;
        await findCategory.save();
        console.log("cat data",findCategory)
        res.json({status:true});
    } catch (error) {
        console.log(error);
        res.status(500).json({status: false, message: "Internal Server Error"});
    }
}


const removeProductOffer = async (req, res)=>{
    try {
        const {productId} = req.body;
        const findProduct = await Product.findOne({_id:productId});
        const percentage = findProduct.productOffer
        findProduct.salePrice = findProduct.salePrice+Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer = 0;
        await findProduct.save();
        res.json({status:true})
    } catch (error) {
         console.log(error);
         res.status("An error os coming ")
    }
}

const blockProduct = async (req, res) => {
    try {
        const id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error);
        res.send('An error is coming');
    }
}

const unBloackProduct= async (req, res) =>{
    try {
        const id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error);
        res.send('An Error in product Blocaking...');
    }
}

const getEditProduct = async (req,res) => {
    try {
        
        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({});
        const brand = await Brand.find({});
        res.render('edit-product',{
            message:"",
            product:product,
            cat:category,
            brand:brand,
        });

    } catch (error) {
        res.redirect('/admin/pageerror');
    }
}

const editProduct = async (req,res) => {
    try {
        const id = req.params.id;
        const product = await Product.findOne({_id:id});
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName:data.productName,
            _id:{$ne:id}
        })

        if(existingProduct){
            res.status(400).json({error:"Product with this name already exists. Please try with another name"})
            res.render('edit-product',{message:"Product with this name already exists. Please try with another name"})
        }

        const images = [];

        const category = await Category.findOne({name:data.category})

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            req.files.forEach(file => {
                images.push(file.filename);
            });
        }

        const updateFields = {
            productName:data.productName,
            description:data.description,
            brand:data.brand,
            category:category._id,
            regularPrice:data.regularPrice,
            salePrice:data.salePrice,
            quantity:data.quantity,
            color:data.color
        }

        if(req.files.length>0){
            updateFields.$push = {productImage:{$each:images}};
        }

        await Product.findByIdAndUpdate(id,updateFields,{new:true});
        res.redirect('/admin/products');

    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror')
    }
}

const deleteSingleImage = async (req,res) => {
    try {

        const {imageNameToServer,productIdToServer} = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}});
        const imagePath = path.join("public","uploads","re-image",imageNameToServer);
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted succefully`);
        }else{
            console.log(`Imaage ${imageNameToServer} not found`);
        }
        res.send({status:true});
        
    } catch (error) {
        res.redirect('/admin/pageerror')
    }
}


const addReview = async (req, res) => {

    try {
        const {productId, comment, rating} = req.body;

        console.log({productId, comment, rating});
        if(rating < 1 || rating > 5){
            return res.status(400).send('All fields are required...😁');
        }


        const product = await Product.findById(productId)

        if(!product){
            return res.status(400).send('Product not Font..😂');
        }

        product.reviews.push({
            userId: req.session.userId || null,
            comment: comment,
            rating  : rating
            
        })


        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / product.reviews.length;

        await product.save();

        res.redirect(`/productdetails?id=${productId}`);

    } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).send("Something went wrong.");
    }
}


const getChekout = async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log(userId);
        if(!userId){
            return res.status(404).send('No User, Page not Found...🤦‍♂️');
        }

        const user = await User.findById(userId).populate('addresses');
        if (!user) {
            return res.status(404).send('User not found');
        }

        
        const cartProduct = await Cart.findOne({userId}).populate('products.productId');
        if(!cartProduct){
            res.redirect('/user-cart');
        }

        const productCount = cartProduct.products.length;
        let total = 0;
        let subtotal = 40;
        cartProduct.products.forEach(product => {
            const productPrice = product.productId.salePrice || product.productId.regularPrice;
            total += productPrice * product.quantity
            subtotal += productPrice * product.quantity;
        });

        const products = await Product.find({ _id: { $in: cartProduct.products.map(product => product.productId) } });

        res.render('checkOutPage', {
            userId: user,
            cartProduct: cartProduct,
            products: products,
            subtotal: subtotal,
            productCount:productCount,
            total
        })

        req.session.subtotal = subtotal;
    } catch (error) {
        console.error('Error in getChekout:', error);
        res.status(500).send('An error occurred while loading the checkout page.');
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const theAddress = req.body.selectedAddressId;
        const selectedPaymentMethod = req.body.selectedPaymentMethod
        
        const subtotal = req.session.newSubtotal || req.body.subtotal;
        const discount = req.session.discount;
        const coupenCode = req.session.coupenCode
     
        const user = await User.findOne({_id:userId});
        
        const selectAddress = user.addresses[theAddress];

        const cartProduct = await Cart.findOne({userId: userId});
        console.log('user:', user);
        console.log('selectAddress:', selectAddress);
        console.log('cartProduct:', cartProduct);
        
        const productCount = cartProduct.products.length;
        
        

        const orders = new Order(
            {
                userId: userId,
                orderId: orderId.generate() ,
                products:cartProduct.products.map(product => ({
                        productId:product.productId,
                        quantity: product.quantity,
                        price: product.totalPrice
                })),
                totalAmount: subtotal,
                paymentMethord: 'COD',
                discount:discount,
                address:{
                    addressType: selectAddress.addressType,
                    name: selectAddress.name,
                    streetAddress: selectAddress.streetAddress,
                    city: selectAddress.city,
                    state: selectAddress.state,
                    pincode: selectAddress.pincode,
                    mobile: selectAddress.mobile,
                    altmobile: selectAddress.altMobile,
                },
                coupenCode: coupenCode,
            }

        )
        await orders.save();
        const updateProductQuantity = cartProduct.products.map(async (product) => {
            const theProduct = await Product.findById(product.productId);
            if(theProduct){
                console.log(theProduct.quantity)
                
                console.log(product.quantity)
                
                const newQuantity = theProduct.quantity - product.quantity;
                await Product.findByIdAndUpdate(product.productId, 
                    {quantity: newQuantity},
                )
            }
        })
        await Promise.all(updateProductQuantity);
        const removeproductInCart = await Cart.findByIdAndDelete(cartProduct);

        console.log('The order Data enter Successfully...');
        res.render('orderSuccess', {orderId : orders._id , productCount:productCount})
    } catch (error) {
        console.log('Place order..', error);
    }
} 


const orderDetails = async (req, res) =>{
    try {
        const orderId = req.query.orderId || req.body.orderId;
        
        console.log('orderId:', orderId);

        const order = await Order.findById(orderId).populate('products.productId');
        
        if(!order){
            console.log('!order')
        }
        
        console.log('order:', order);
        console.log('The order-detailes page is  loaded...🕺');
        res.render('order-detailes', 
            {
                orderId: orderId,
                totalAmount: order.totalAmount,
                products: order.products,
                address: order.address,
                status: order.status,
                paymentMethord: order.paymentMethord,
                shortOrderId: order.orderId,
                orderDate:order.orderDate,
                couponDiscount:order.discount,
                paymentStatus: order.paymentStatus,
                order_id: order._id
                
            }
        );
    } catch (error) {
        console.log('orderDetails:', error);

    }
}

const orderCancellation = async (req, res) =>{
    try {
        const orderId = req.body.orderId;
        const userId = req.session.userId
        const theProductId = req.body.productId;
        const productPrice = req.body.productPrice;
  
        console.log("productPrice:",productPrice)
        const quantity = req.body.quantity;

        console.log("theProductId:", theProductId);

        console.log('orderId:', orderId);

        const order = await Order.findById(orderId).populate('products.productId')

        if(!order){
            console.log('There is no order...🤦‍♂️');
        }

        console.log("order:", order);

        const product = order.products.find(product => product.productId._id.toString() === theProductId);

        

        console.log('product:', product);

        
        product.status = 'Cancelled'

        const productSchema = await Product.findById(product.productId);

        if(productSchema){
    
          productSchema.quantity += product.quantity;
          await productSchema.save();
        }
        
        const orderCancell = order.products.every(product => product.status === 'Cancelled')

        order.lastUpdate = new Date();
        
        if(orderCancell){
            order.status = 'Cancelled';
            if(order.paymentStatus === 'Failure'){
                order.paymentStatus = 'Failure'
            }else{
                order.paymentStatus = 'Refund'
            }
            
            
        }else{
            order.status = 'Pending';
        }

        await order.save();

        
        
        let wallet = await Wallet.findOne({userId});
        if(!wallet){
            wallet = new Wallet({userId:userId});
        }
        if(order.paymentStatus === 'Failure'){
            console.log('User is not payment compleated')
        }else{
            wallet.balance += order.totalAmount;
        wallet.transactions.push({
                whichTransaction: 'Creadit',
                orderId: order._id,
                transactionAmount:Number(productPrice)
                
        })
        }
        
        await wallet.save();
        // const orderCancell = await Order.findByIdAndUpdate(orderId,
        //     {status:'Cancelled'},
        //     {new: true}
        // );

        res.redirect(`/order-details?orderId=${orderId}`);
    } catch (error) {
        console.log('orderCancellation:', error);
      
    }
}

const productList = async (req, res) =>{
    try {
        const userId = req.session.userId;
        
        const  {sort, order , page = 1, limit = 8 , search  = '', category = '' } = req.query;

        const  statingIndex = (page - 1) * limit;

        const totalProducts = await Product.countDocuments();
        

        let cartProductCount = 0;
        const cart = await Cart.findOne({userId});
        if(cart){
         cartProductCount = cart.products.length || 0;
        }
       
        const searchQuery = {isBlocked:false}
        if(search){
            searchQuery.$or = [
                {productName:{$regex: search, $options:'i'}}
            ]
        }

        
        
        if(category){
            const categoryObject = await Category.findOne({name: category});
            if(categoryObject){
                searchQuery.category = categoryObject._id;
            }else{
                searchQuery.category = null;
            }
        }
       
        const sortData = {};
        switch (sort){
            case 'sale-price':
                sortData.salePrice = order === 'decending' ? -1 : 1;
                break;
            case 'newarrivals':
                sortData.createdAt = order === 'decending' ? -1 : 1;
                break;
            case 'product-name':
                sortData.productName = order === 'decending' ? -1 : 1;
                break;
            case 'popularity':
                sortData.popularity = order === 'decending' ? -1 : 1;
                break;
            case 'average-ratings':
                sortData.reviews = order ===  'decending' ? -1 : 1;
                break;
            default:
                sortData.createdAt = -1;     
        }
        
        const products = await Product.find(searchQuery).populate('category').sort(sortData).skip(statingIndex).limit(Number(limit));
        
        const totalProductCount = await Product.countDocuments(searchQuery);


        const cartProduct = cart ? cart.products : [];
        const productAndCartStatus = products.map(product => ({
            ...product._doc,
            isInCart: cartProduct.some(inProduct => inProduct.productId.toString() === product._id.toString())
        }))

        
      

        res.render('products-page',
             { 
                products: productAndCartStatus , 
                currentPage: Number(page),
                totalPage: Math.ceil(totalProducts / limit),
                limit: Number(limit),
                productCount:cartProductCount,
                totalProductCount:totalProductCount,
                search: search,
                category: category,
                sort: sort,
                order: order
            }
        );
    } catch (error) {
        console.log('productList:', error);
    }
}

const retrnDeliverdOrder = async(req, res) => {
    try {
        const {orderId, productId, quantity} = req.body
        console.log({orderId, productId, quantity})

        const order = await Order.findById(orderId).populate('products.productId')

        if(!order){
            console.log('There is no order...🤦‍♂️');
        }

        const product = order.products.find(product => product.productId._id.toString() === productId);

        
        product.status = 'Return'

        const productSchema = await Product.findById(product.productId);

        
        
        const orderCancell = order.products.every(product => product.status === 'Return')
        
        if(orderCancell){
            order.status = 'Return';
            
        }else{
            order.status = 'Deliverd';
        }

        await order.save();
        
        
        // const orderCancell = await Order.findByIdAndUpdate(orderId,
        //     {status:'Cancelled'},
        //     {new: true}
        // );

        res.redirect(`/order-details?orderId=${orderId}`);
    } catch (error) {
        console.log('retrnDeliverdOrder', error)
    }
}



const getWalletPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const wallet = await Wallet.findOne({userId:userId});
        
        console.log('The Wallet Loaded...');
        res.render('wallet', {
            wallet,
            transactions : wallet.transactions
        })
    } catch (error) {
        console.log('getWalletPage:', error);      
    }
}


const orderInvoiceDownlod = async (req, res) => {
    try {
        const doc = new PDFDocument({ margin: 50 });
        const order = await Order.findById(req.params.orderId)
            .populate('userId')
            .populate('products.productId')
            .populate('address');

        const fileName = `order-invoice-${order._id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);

   
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('L0oser', { align: 'center' });
        doc.moveDown();

  
        doc.fontSize(18)
           .text('Order Invoice', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12)
           .font('Helvetica');
        
        doc.text(`Order ID: ${order.orderId}`)
           .text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`)
           .text(`Payment Method: ${order.paymentMethord}`)
           .moveDown();

        const customerStartY = doc.y;
       
        doc.font('Helvetica-Bold')
           .text('Billing Details:', { continued: true, width: 250 })
           .font('Helvetica')
           .moveDown()
           .text()
           .text(order.address.name)
           .text(order.address.streetAddress)
           .text(`${order.address.city}, ${order.address.state}`)
           .text(`PIN: ${order.address.pincode}`)
           .text(`Phone: ${order.address.mobile}`);

   
        doc.font('Helvetica-Bold')
           .text('Shipping Details:', 300, customerStartY, { width: 250 })
           .font('Helvetica')
           .moveDown()
           .text(order.address.name, 300)
           .text(order.address.streetAddress, 300)
           .text(`${order.address.city}, ${order.address.state}`, 300)
           .text(`PIN: ${order.address.pincode}`, 300)
           .text(`Phone: ${order.address.mobile}`, 300);

        doc.moveDown(2);

       
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        
  
        doc.text('Product', 50, tableTop)
           .text('Quantity', 300, tableTop)
           .text('Price', 400, tableTop)
           .text('Total', 500, tableTop);


        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        let tableY = tableTop + 30;
        doc.font('Helvetica');

        order.products.forEach((product, index) => {
            doc.text(product.productId.productName, 50, tableY, { width: 200 })
               .text(product.quantity.toString(), 300, tableY)
               .text(`Rs${product.price}`, 400, tableY)
               .text(`Rs${product.quantity * product.price}`, 500, tableY);

            tableY += 30;

            doc.moveTo(50, tableY - 10)
               .lineTo(550, tableY - 10)
               .stroke();
        });


        doc.moveDown(2);
        const summaryX = 400;
        const summaryStartY = doc.y;


        doc.rect(summaryX - 10, summaryStartY - 10, 170, 100)
           .stroke();


        doc.font('Helvetica-Bold')
           .text('Order Summary', summaryX, summaryStartY)
           .moveDown(0.5);
        
        doc.font('Helvetica')
           .text(`Subtotal: Rs${order.totalAmount - 40}`, summaryX)
           .text(`Discount: Rs${order.discount || 0}`, summaryX)
           .text(`Delivery Charge: RS40`)
           .moveDown(0.5);
        
        doc.font('Helvetica-Bold')
           .text(`Total Amount: Rs${order.totalAmount}`, summaryX);

        
        doc.fontSize(10)
           .font('Helvetica')
           .text(
               'Thank you for your purchase!',
               50,
               doc.page.height - 100,
               { align: 'center' }
           )
           .moveDown()
           .text(
               `Invoice generated on ${new Date().toLocaleString()}`,
               { align: 'center' }
           );

        doc.end();

    } catch (error) {
        console.error('orderInvoiceDownload error:', error);
        res.status(500).send('Error generating invoice PDF');
    }
};

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unBloackProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    addReview,
    getChekout,
    placeOrder,
    orderDetails,
    orderCancellation,
    productList,
    retrnDeliverdOrder,
    getWalletPage,
    orderInvoiceDownlod

}