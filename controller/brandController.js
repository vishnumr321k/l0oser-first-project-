const Brand = require('../model/Admin/brandSchema');
const Product = require('../model/Admin/productSchema');

const getBrandpage = async (req, res) =>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const brandData = await Brand.find({}).sort({createAt: -1}).skip(skip).limit(limit);
        const totalBrands = await  Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands / limit);
        const reverseBrand = brandData.reverse();
        res.render('brands', {
            data: reverseBrand,
            currentPage: page,
            totalPages:totalPages,
            totalBrands: totalBrands
        });


    } catch (error) {
        console.error(error);
        res.send('Page is not found');
    }
}

 
const addBrand = async(req, res) =>{
    try {
        const brand = req.body.name;
        const findBrand = await Brand.findOne({brand});
        if(!findBrand){
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName : brand,
                brandImage : image
            })
            await newBrand.save();
            res.redirect('/admin/brands');
        } 
    } catch (error) {
        res.send('page is not Found');
        
    }
}


const blockBrand = async(req, res) =>{
    try {
        const id = req.query.id;
        await Brand.updateOne({_id:id}, {$set:{isBlocked:true}});
        res.redirect('/admin/brands');
    } catch (error) {
        console.log(error);
        res.send('The page is An Error')
    }
}


const unBloackBrand = async(req, res) =>{
    try {
        const id = req.query.id;
        await Brand.updateOne({_id:id}, {$set:{isBlocked:false}});
        res.redirect('/admin/brands');
    } catch (error) {
        console.log(error);
        res.send('Error unblocking the brand');
    }
}


const deleteBrand = async(req, res) =>{
    try {
        const {id} = req.query;
        if(!id){
            return res.status(400).send('page error')
        }
        await Brand.deleteOne({_id:id});
        res.redirect('/admin/brands')
    } catch (error) {
        console.error('Error deleating brand:',error);
        res.status(500).send('Error')
    }
}

module.exports = {
    getBrandpage,
    addBrand,
    blockBrand,
    deleteBrand,
    unBloackBrand

} 