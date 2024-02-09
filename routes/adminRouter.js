const express = require('express');
const adminRouter = express(); 
const adminController = require('../controller/adminController');
const productController = require('../controller/productController')
const multer = require('multer')
const path = require('path')



adminRouter.set('view engine', 'ejs');
adminRouter.set('views','./views/admin');



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "..", "public", "images"))
  },
  filename: (req, file, cb) => {
     
      const name = Date.now() + '-' + file.originalname
      cb(null, name)
  }
})
  

const upload = multer({ storage: storage }).array('image', 4)




adminRouter.get('/home', (req, res) => {
  const username = req.session.username;
  res.render('users/home', { username });
});


adminRouter.get('/', adminController.loadLogin) ;
adminRouter.post('/',adminController.verifyLogin);
adminRouter.get('/dashboard',adminController.loadAdmin)
adminRouter.get('/users', adminController.loadUsers);
adminRouter.get('/category', adminController.loadCategory);
adminRouter.post('/category',adminController.addCategory)
adminRouter.post('/category/deleteCategory',adminController.deleteCategory)
adminRouter.post('/category/listOrUnlist',adminController.listOrUnlist)
adminRouter.post('/block-user', adminController.blockUnblockUser);
adminRouter.get('/edit', adminController.loadeditCategory);
adminRouter.post('/edit', adminController.editCategory);
adminRouter.get('/products',productController.loadProducts)
adminRouter.get('/products/addProducts', productController.loadAddProducts)
adminRouter.post('/products/addProducts',upload, productController.addProducts)
adminRouter.get('/editProducts',productController.loadEditProduct)
adminRouter.post('/editProducts',upload,productController.editProducts)
adminRouter.get('/deleteProduct',productController.deleteProduct)




module.exports = adminRouter;


