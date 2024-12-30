 const User = require('../model/user/UserSchema');


 const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || ''; // Default to empty string
        let page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = 10;

        const filter = {
            isAdmin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        };

        // Get user data for the current page
        const userData = await User.find(filter)
            .limit(limit)
            .skip((page - 1) * limit);

        // Get total count of matching documents
        const count = await User.countDocuments(filter);

        res.render('customers', {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search
        });
    } catch (error) {
        console.error('Error fetching customer info:', error);
        res.status(500).send('Server Error');
    }
};

 const unblockCustomer = async(req, res) => {
    try {
        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, {isBlocked: false});
        res.redirect('/admin/user');
    } catch (error) {
        console.log('Error unBlocking User :', error);
        res.status(500).send('Internal Server Error');
    }
};

const blockCoustomer = async(req, res) =>{
        try {
            const userId = req.query.id;
            await User.findByIdAndUpdate(userId, {isBlocked: true});
            res.redirect('/admin/user');
        } catch (error) {
            console.error('Error blocking User ', error);
            res.status(500).send('Internal Server Error');
        }
};
 

const theCoustomer = async (req, res) =>{
    try {
        res.render('customers');
    } catch (error) {
        res.send('page not found');
    }
}



 module.exports =  {
    customerInfo,
    blockCoustomer,
    unblockCustomer,
    theCoustomer

 }