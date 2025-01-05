
const Category = require('../model/Admin/categorySchema');
const Product = require('../model/Admin/productSchema');


const categoryInfo = async (req, res) =>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)* limit;

        const  categoryData = await Category.find({})
        .sort({createAt:-1})
        .skip(skip)
        .limit(limit);

        const totalCategories  = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render('category', {
            cat:categoryData,
            currentPage : page,
            totalPages: totalPages,
            totalCategories:totalCategories
        });
    } catch (error) {
        console.error(error);
        res.send('error is comming...😍😍')
    }
}

const addCategory = async (req, res) => {
    // console.log(req.body)
   
   
    try {
        const {name, description} = req.body;
        const exitingCategory = await Category.findOne({name});
        if(exitingCategory){
            return res.status(400).json({error:'Catogory alert exits'})
        }
        const newCategory = new Category({
            name,
            description
        })
        await newCategory.save();
        return res.json({message:"Catogory added successfully"})
    } catch (error) {
        console.error('Error in addCategory:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}


const addCategoryOffer = async (req, res) =>{
    try {
        const percentage = parseInt(req.body.percentage, 10);
        const categoryId = req.body.categoryId;

        if (!percentage || !categoryId) {
            return res.status(400).json({ status: false, message: 'Invalid input data' });
        }

    
        const category = await Category.findById(categoryId);
        if(!category){
            return res.status(404).json({status: false, message: 'Category not Fount'})
        }

       
        const products = await Product.find({ category:categoryId });
        const hasProductOffer = products.some(product => product.productOffer > percentage);
        if(hasProductOffer){
            return res.json({status:false, message:'Product within this category already have product Offer'})
        }

        if(hasProductOffer){
            return res.json({
                status: false,
                message: 'A product in this category already has a higher product offer'
            });
        }

        await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

        for(const product of products){
            product.productOffer =0;
            product.salePrice = product.regularPrice;
            await product.save();
        }
        return res.json({ status: true, message: 'Category offer added successfully' });

    } catch (error) {
        console.error('Error in addCategoryOffer:', error);
        res.status(500).json({status: false,message: 'Internal Server error'});
    }
}



const removeCategoryOffer = async(req, res) =>{
    try {
        const categoryId = req.body.categoryId;
        // console.log('dsfhdskjldksj')
        // console.log('Received data:', req.body);
        if (!categoryId) {
            return res.status(400).json({ status: false, message: "Category ID is required" });
        }
        const category = await Category.findById(categoryId);


        if(!category){
            return res.status(404).json({status:false, message:"Category not found"})
        }


        const percentage =  category.categoryOffer;
        if (percentage === 0) {
            return res.status(400).json({ status: false, message: "No offer to remove" });
        }
        const products = await Product.find({category:categoryId});

        if(products.length > 0){
            for(const product of products){
                product.salePrice += product.regularPrice;
                product.productOffer = 0;
                await product.save();
            }
        } 
        category.categoryOffer = 0;
        await category.save();
        res.json({status :true, message: "Category offer removed successfully" })
    } catch (error) {
        console.error('Error in removeCategoryOffer:', error);
        res.status(500).json({status:false, message:"Internal Server Error"});
    }
}

const getListCategory = async(req, res) =>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id}, {$set:{isListed:false}});
        res.redirect('/admin/category');
    } catch (error) {
        res.send('page error');
    }
}


const getUnlistCategory = async(req, res) =>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id}, {$set:{isListed:true}});
        res.redirect('/admin/category');
    } catch (error) {
        res.send('Page error');
    }
}


const getEditCategory = async (req, res) =>{
    try {
        let id = req.query.id;
        if(!id){
            return res.status(400).send('INvalid Category ID.')

          
        }
        const category = await Category.findOne({_id:id});
        if(!category){
            return res.status(404).send("Category not found.");
        }
        res.render('edit-category', {category});
    } catch (error) {
        res.send('Page find an Error');
    }
}

const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const { categoryName, description } = req.body;

        if (!id || !categoryName || !description) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const existingCategory = await Category.findOne({ name: categoryName });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category name already exists. Please use another name." });
        }

        const updateCategory = await Category.findByIdAndUpdate(
            id,
            { name: categoryName, description: description },
            { new: true }
        );

        if (updateCategory) {
            return res.status(200).json({ success: true, message: "Category updated successfully." });
        } else {
            return res.status(500).json({ success: false, message: "Internal Server Error." });
        }
    } catch (error) {
        console.error("Error in editCategory:", error);
        return res.status(500).json({ success: false, message: "An error occurred. Please try again." });
    }
};

module.exports = {
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory

}