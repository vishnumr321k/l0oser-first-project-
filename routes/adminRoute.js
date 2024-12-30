const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const adminAuth = require('../middleware/authMiddleWare');

const customerController = require('../controller/coustomerController');
const categoryController = require('../controller/categoryController');
const brandController = require('../controller/brandController');
const productController = require('../controller/productController');
const coupenController = require('../controller/coupenController');
const salesReportController = require('../controller/salesReportController');
const multer = require('multer');
const storage = require('../helpers/multer');

const uploads =  multer({storage:storage});


// login management
router.get('/check', adminController.serverChecking);
router.get('/signin', adminController.loadSignin);
router.get('/dashboard',adminAuth.adminAuth, adminController.loadDasheBoard);
router.post('/signin',adminController.adminSignin);
router.post('/logout',adminController.adminLogout);


// customer management 
router.get('/user',adminAuth.adminAuth,customerController.customerInfo);
router.get('/blockcustomer',adminAuth.adminAuth, customerController.blockCoustomer);
router.get('/unblockcustomer', adminAuth.adminAuth,customerController.unblockCustomer);

router.get('/coutstomer',adminAuth.adminAuth, customerController.theCoustomer);

// category Management
router.get('/category', adminAuth.adminAuth,categoryController.categoryInfo);
router.post('/addCategory', categoryController.addCategory);
router.post('/addCategoryOffer', categoryController.addCategoryOffer)
router.post('/removeCategoryOffer', categoryController.removeCategoryOffer);
router.get('/listCategory',adminAuth.adminAuth,categoryController.getListCategory);
router.get('/unlistCategory',adminAuth.adminAuth, categoryController.getUnlistCategory);
router.get('/editCategory', adminAuth.adminAuth,categoryController.getEditCategory);
router.post('/editCategory', categoryController.editCategory);


// Brand Managemend
router.get('/brands', adminAuth.adminAuth,brandController.getBrandpage);
router.post('/brands', uploads.single('image'),brandController.addBrand);
router.get('/blockBrand',adminAuth.adminAuth, brandController.blockBrand);
router.get('/unBlockBrand',adminAuth.adminAuth, brandController.unBloackBrand);
router.get('/deleteBrand',adminAuth.adminAuth, brandController.deleteBrand);

// product Management
router.get('/addproduct',adminAuth.adminAuth,productController.getProductAddPage);
router.post('/addproduct',uploads.array('images',4),productController.addProducts);
router.get('/products', adminAuth.adminAuth,productController.getAllProducts)
router.post('/addProductOffer', productController.addProductOffer);
router.post('/removeProductOffer',productController.removeProductOffer);
router.get('/blockProduct',adminAuth.adminAuth, productController.blockProduct);
router.get('/unBlockproduct',adminAuth.adminAuth,productController.unBloackProduct);
router.get('/editproduct',adminAuth.adminAuth,productController.getEditProduct);
router.post('/editproduct/:id',uploads.array('images',4),productController.editProduct);
router.post('/deleteimage',productController.deleteSingleImage);

// order details
router.get('/order-list', adminAuth.adminAuth, adminController.orderLists);
router.get('/order-details',adminAuth.adminAuth, adminController.orderDetails);
router.get('/stock-management', adminAuth.adminAuth, adminController.InventorySection);
router.post('/update-stock-management', adminAuth.adminAuth, adminController.updateStock);
router.post('/update-orderStatus', adminAuth.adminAuth, adminController.updateOrderStatus);
router.delete('/delete-order/:orderId', adminAuth.adminAuth, adminController.delateOrder);

// coupen
router.get('/coupen-page', adminAuth.adminAuth, coupenController.getCoupenPage)
router.post('/creat-coupen', adminAuth.adminAuth, coupenController.creteCoupen)
router.post('/delete-coupon',adminAuth.adminAuth, coupenController.deleteCoupen);

// sale-report
router.get('/sales-report', adminAuth.adminAuth,salesReportController.getSaleReport)
router.get('/sales-report-pdf', adminAuth.adminAuth, salesReportController.generateSalesPDF);
router.get('/sales-report-exel', adminAuth.adminAuth, salesReportController.generateSalesExel);

// dash


router.use((req,res)=>{
    res.redirect("/admin")
})

module.exports = router;