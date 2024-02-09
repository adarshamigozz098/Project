const express=require('express')

const userRouter=express()
const userController=require('../controller/userController')
const auth = require('../middleware/auth')


userRouter.set('view engine','ejs')
userRouter.set('views','./views/user')


userRouter.get('/',userController.loadHome)
userRouter.get('/shop',userController.loadShop)
userRouter.get('/single',userController.loadSingle)
userRouter.get('/about',userController.loadAbout)
userRouter.get('/contact',auth.isLogin,userController.loadContact)
userRouter.get('/checkout',auth.isLogin,userController.loadCheckout)
userRouter.get('/cart',auth.isLogin,userController.loadCart)
userRouter.post('/addToCart/:id',auth.isLogin,userController.addToCart);
userRouter.delete('/cart/remove/:productId',auth.isLogin,userController.removeProduct)
userRouter.get('/login',auth.isLogout,userController.loadLogin)
userRouter.post('/login',userController.verifyLogin);
userRouter.get('/signup',userController.loadSign)
userRouter.post('/signup',userController.verifySignup)
userRouter.get('/otp',userController.loadData)
userRouter.post('/otp',userController.verifyOtp)
userRouter.get('/logout',auth.isLogin,userController.logout);
userRouter.get('/productDetails',userController.loadSingle)



module.exports=userRouter



