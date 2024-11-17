const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');



router.get('/check', adminController.serverChecking);
router.get('/signin', adminController.loadSignin);
router.get('/dashe-board', adminController.loadDasheBoard);
router.post('/signin', adminController.adminSignin);
module.exports = router;

