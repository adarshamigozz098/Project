const express = require("express");
const adminRouter = express();
const adminController = require("../controller/adminController");
const productController = require("../controller/productController");
const multer = require("multer");
const path = require("path");
const product = require("../model/product");
const isAdminAuthenticated = require("../middleware/adminAuth").isAdminAuthenticated;

adminRouter.set("view engine", "ejs");
adminRouter.set("views", "./views/admin");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "images"));
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});


const upload = multer({ storage: storage }).array("image", 4);


adminRouter.get("/home", (req, res) => { const username = req.session.username;res.render("users/home", { username });});

adminRouter.get("/", adminController.loadLogin);
adminRouter.post("/", adminController.verifyLogin);
adminRouter.get("/logout", adminController.logoutAdmin);
adminRouter.get("/dashboard", isAdminAuthenticated, adminController.loadAdmin);
adminRouter.get("/users", isAdminAuthenticated, adminController.loadUsers);
adminRouter.get("/category",isAdminAuthenticated,adminController.loadCategory);
adminRouter.post("/category", adminController.addCategory);
adminRouter.post("/category/deleteCategory", adminController.deleteCategory);
adminRouter.post("/category/listOrUnlist", adminController.listOrUnlist);
adminRouter.post("/block-user", adminController.blockUnblockUser);
adminRouter.get("/edit", adminController.loadeditCategory);
adminRouter.post("/edit", adminController.editCategory);

adminRouter.get("/products",isAdminAuthenticated, productController.loadProducts);
adminRouter.get("/products/addProducts", isAdminAuthenticated,productController.loadAddProducts);
adminRouter.post("/products/addProducts",upload,productController.addProducts);
adminRouter.get("/editProduct", isAdminAuthenticated, productController.loadEditProduct);
adminRouter.post("/editProduct", upload, productController.editProducts);
adminRouter.get("/deleteProduct", productController.deleteProduct);
adminRouter.post("/deleteImage", productController.deleteImage);
adminRouter.get("/order", isAdminAuthenticated, adminController.loadOrder);
adminRouter.get("/detail", isAdminAuthenticated, adminController.loadDetail);
adminRouter.post("/updateOrderStatus",isAdminAuthenticated,adminController.updateOrderStatus);

adminRouter.get("/salesReport",  isAdminAuthenticated,adminController.salesReport);
adminRouter.get( "/datePicker",isAdminAuthenticated,adminController.datePicker);

// Coupons
adminRouter.get("/coupon", isAdminAuthenticated,adminController.loadCoupon)
adminRouter.get("/addCoupon", isAdminAuthenticated,adminController.LoadaddCoupon)
adminRouter.post("/addCoupon", isAdminAuthenticated, adminController.couponAddPost);
adminRouter.get("/deleteCoupon",isAdminAuthenticated, adminController.deleteCoupon)
adminRouter.get("/editCoupon",isAdminAuthenticated, adminController.loadEditCoupon)
adminRouter.post("/editCoupon",isAdminAuthenticated, adminController.updateCoupon)




module.exports = adminRouter;
