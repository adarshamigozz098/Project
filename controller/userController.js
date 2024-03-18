const User = require("../model/userModel");
const product = require("../model/product");
const Cart = require("../model/cart");
const coupon = require("../model/coupon");
const moment = require("moment");
const config = require("../config/config");
const razorpay = require("razorpay");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const sharp = require("sharp");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const userOTPverification = require("../model/userOTPverification");
const randomstrings = require("randomstring");
const order = require("../model/order");
const { connections } = require("mongoose");
const category = require("../model/category");

var instance = new razorpay({
  key_id: "rzp_test_eUnQ885ah336VG",
  key_secret: "2iLbGXeXJmvQGPb4dMOPlrST",
});


const verifySignup = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword } = req.body;
    const emailExist = await User.findOne({ email: email });

    if (emailExist) {
      req.flash("message", "Existing User");
      return res.redirect("/signup");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newuser = new User({
      username,
      phone,
      email,
      password: hashedPassword,
      isAdmin: 0,
      verified: false,
    });

    await newuser.save();
    await sendMail(newuser, res);
    console.log("success");
  } catch (error) {
    console.log(error);
    req.flash("message", "An error occurred. Please try again.");
    return res.redirect("/signup");
  }
};


const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });

    if (!userData) {
      req.flash("error", "User not Found");
      return res.redirect("/login");
    }
    if (userData.isBlocked) {
      req.flash("error", "User is blocked");
      return res.redirect("/login");
    }
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      req.flash("message", "Password does not match");
      console.log("password does not match");
      return res.redirect("/login");
    }
    req.session.userId = userData._id;
    console.log(req.session.userId);
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Internal Server Error");
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



const sendMail = async ({ email }, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: "pa772250@gmail.com",
        pass: "ozsq enxc hswi rvzt",
      },
    });
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const mailOption = {
      from: "pa772250@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
          <div style="margin: 50px auto; width: 70%; padding: 20px 0; background-color: #c7ecc7; border-radius: 8px;">
            <div style="border-bottom: 1px solid #eee;">
            <a href="hidden" style="font-size: 1.4em; color: #4caf50; text-decoration: none; font-weight: 600;">MINI SHOP</a>
          </div>
            <p style="font-size: 1.1em;">Hi,</p>
            <p>Thank you for choosing MINI SHOP. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
            <h2 style="background: #4caf50; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
            <p style="font-size: 0.9em;">Regards,<br />MINI SHOP</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300;">
              <p>MINI SHOP Inc</p>
              <p>MALAPPURAM 670692</p>
              <p>India</p>
            </div>
          </div>
        </div>`,
    };
    const hashedOTP = await bcrypt.hash(otp, 10);
    const newOTPverification = await new userOTPverification({
      email: email,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    });

    await newOTPverification.save();
    await transporter.sendMail(mailOption);
    console.log(`OTP send for ${email} will be deleted in 1 minutes`);
    setTimeout(async () => {
      await userOTPverification.deleteOne({ email: email });
      console.log(`OTP for ${email} has been deleted after 1 minutes.`);
    }, 60000);

    res.redirect(`/otp?email=${email}`);
  } catch (error) {
    console.log(error);
  }
};



const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await userOTPverification.findOne({ email: email });

    const hashedOtp = user.otp;

    const otpVerified = await bcrypt.compare(otp, hashedOtp);
    if (otpVerified === true) {
      await User.findOneAndUpdate({ email: email }, { verified: true });
      await userOTPverification.deleteOne({ email: email });

      res.redirect("/login");
    } else {
      res.render("otp", { message: "otp is incorrect", email });
    }
  } catch (error) {}
};



const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Resending OTP for email:", email);
    const user = await userOTPverification.findOne({ email: email });

    const oneMinuteAgo = Date.now() - 60 * 1000;
    if (user && user.expiresAt > oneMinuteAgo) {
      console.log(
        "Previous OTP was sent less than one minute ago for email:",
        email
      );
      res.status(400).send("Previous OTP was sent less than one minute ago");
      return;
    }

    if (!user || user.expiresAt < Date.now()) {
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedOTP = await bcrypt.hash(otp, 10);

      await userOTPverification.findOneAndUpdate(
        { email: email },
        {
          otp: hashedOTP,
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
        },
        { upsert: true }
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        auth: {
          user: "pa772250@gmail.com",
          pass: "ozsq enxc hswi rvzt",
        },
      });

      const mailOption = {
        from: "pa772250@gmail.com",
        to: email,
        subject: "Verify Your Email",
        html: `<div>Your new OTP is: ${otp}</div>`,
      };

      await transporter.sendMail(mailOption);
      console.log("New OTP sent successfully to:", email);
      res.send("New OTP sent successfully");
    } else {
      console.log("Previous OTP is still valid for email:", email);
      res.status(400).send("Previous OTP is still valid");
    }
  } catch (error) {
    console.error("Error resending OTP for email:", email, error);
    res.status(500).send("Internal server error");
  }
};



// reset
const loadForget = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error);
  }
};



const forgetPasswordVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const details = await User.findOne({ email: email });
    if (details) {
      if (details.verified == 0) {
        res.render("forgetPassword", { message: "Please Verify your email" });
      } else {
        const randomstring = randomstrings.generate();
        const updatedetail = await User.updateOne(
          { email: email },
          { $set: { token: randomstring } }
        );
        sendforgetemail(details.name, details.email, randomstring);
        res.render("forgetPassword", { message: "Please check your email" });
      }
    } else {
      res.render("forgetPassword", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const sendforgetemail = async (name, email, token) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: "pa772250@gmail.com",
        pass: "ozsq enxc hswi rvzt",
      },
    });

    const mailOptions = {
      from: "pa772250@gmail.com",
      to: email,
      subject: "For Reset Password",
      html:
        "<p>Hii " +
        ', please click here to <a href="http://127.0.0.1:6002/forgetpassword?token=' +
        token +
        '">Reset</a> your password.</p>',
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error.message);
  }
};


const resetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const TOkenId = await User.findOne({ token: token });
    if (TOkenId) {
      res.render("resetpassword", { message: "", TOkenId: TOkenId });
    } else {
      res.redirect("/forget");
    }
  } catch (error) {
    console.log(error.message);
  }
};


const resetpassword = async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const Token = req.body.token;

    if (password === confirmPassword && Token) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatepass = await User.findOneAndUpdate(
        { _id: Token },
        { $set: { password: hashedPassword } }
      );
      if (updatepass) {
        req.flash("success", "Password changed successfully");
        res.redirect("/login");
        console.log("Password changed successfully");
        return;
      }
    }
    req.flash("error", "Password update failed");
    res.redirect("/forget");
  } catch (error) {
    console.log(error.message);
    req.flash("error", "An error occurred");
    res.redirect("/forget");
  }
};


const loadSign = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error);
  }
};


const loadLogin = async (req, res) => {
  try {
    let currentUser;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
    }
    res.render("login", { currentUser });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const loadHome = async (req, res) => {
  try {
    const products = await product.find().limit(4);
    let currentUser;

    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
      if (currentUser && currentUser.isBlocked) {
        req.flash(
          "error",
          "Your account has been blocked. Please login again."
        );
        return res.redirect("/login");
      }
    }
    res.render("home", { products, currentUser });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// shop
const ITEMS_PER_PAGE = 6;

const loadShop = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    let query = {};

    if (req.query.search) {
      query.name = { $regex: new RegExp(req.query.search, "i") };
    }
    if (req.query.category) {
      const categoryId = await category
        .findOne({ name: req.query.category })
        .select("_id");
      if (categoryId) {
        query.category = categoryId;
      }
    }
    if (Object.keys(query).length === 0 && query.constructor === Object) {
      query = {};
    }

    let currentUser;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
      if (currentUser && currentUser.isBlocked) {
        req.flash(
          "error",
          "Your account has been blocked. Please login again."
        );
        return res.redirect("/login");
      }
    }

    let sortOption = {};
    if (req.query.sort === "lowToHigh") {
      sortOption.price = 1;
    } else if (req.query.sort === "highToLow") {
      sortOption.price = -1;
    }

    let priceFrom = parseInt(req.query.priceFrom);
    let priceTo = parseInt(req.query.priceTo);

    if (!isNaN(priceFrom) && !isNaN(priceTo)) {
      query.price = { $gte: priceFrom, $lte: priceTo };
    } else if (!isNaN(priceFrom)) {
      query.price = { $gte: priceFrom };
    } else if (!isNaN(priceTo)) {
      query.price = { $lte: priceTo };
    }

    query.is_listed = true;

    const totalProducts = await product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const categories = await category.distinct("name");

    const productData = await product
      .find(query)
      .sort(sortOption)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .exec();

    res.render("shop", {
      product: productData,
      currentPage: page,
      totalPages: totalPages,
      sort: req.query.sort,
      currentUser,
      categories: categories,
      selectedCategory: req.query.category || "",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



const loadContact = async (req, res) => {
  try {
    let currentUser;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
      if (currentUser && currentUser.isBlocked) {
        req.flash(
          "error",
          "Your account has been blocked. Please login again."
        );
        return res.redirect("/login");
      }
      res.render("contact", { currentUser: req.session.user_id });
    }
  } catch (error) {
    console.log(error);
  }
};


const loadSingle = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await product.findOne({ _id: id });
    res.render("productDetails", {
      product: productData,
      currentUser: req.session.userId,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadAbout = async (req, res) => {
  try {
    res.render("about");
  } catch (error) {
    console.log(error);
  }
};

const loadCheckout = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    const userCart = await Cart.findOne({ user_id: req.session.userId });
    const coupons = await coupon.find();

    let totalPrice = 0;
    if (userCart && userCart.items) {
      userCart.items.forEach((item) => {
        const itemTotal = parseFloat(item.price);
        totalPrice += itemTotal;
      });
    }

    let currentUser;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
      if (currentUser && currentUser.isBlocked) {
        req.flash(
          "error",
          "Your account has been blocked. Please login again."
        );
        return res.redirect("/login");
      }
    }
    
    res.render("checkout", {
      Data: userData,
      cart: userCart,
      totalPrice,
      currentUser,
      coupons,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadCheckAdd = async (req, res) => {
  try {
    res.render("checkAdd");
  } catch (error) {
    console.log(error);
  }
};

const generateCustomUserId = () => {
  const prefix = "";
  const uniqueId = Math.floor(Math.random() * 1000000);

  return `${prefix}${uniqueId}`;
};

const placeOrder = async (req, res) => {
  try {
    const date = new Date();
    const user_id = req.session.userId;
    const { address, paymentMethod } = req.body;
    const userValue = await User.findById(user_id);
    console.log(userValue,"vall");
    if (!userValue) {
      return res.status(400).json({ success: false, message: "User not found." });
    }   
    const selectedAddress = userValue.address.find(addr => addr._id.toString() === address);
    console.log(selectedAddress,"select:");
  
    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: "Selected address not found." });
    }
    const delivery_address = selectedAddress;

    const cartData = await Cart.findOne({ user_id: user_id });

    if (!cartData) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found for the user." });
    }
    const userData = await User.findById(user_id);
    if (!userData) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }
    const cartProducts = cartData.items || [];

    const totalAmount = cartProducts.reduce(
      (total, item) => total + item.total_price,
      0
    );

    if (paymentMethod === "COD" && totalAmount > 1000) {
      return res.status(400).json({
        success: false,
        message: "Cash on delivery orders cannot exceed 1000 INR.",
      });
    }
    if (
      paymentMethod == "Wallet" &&
      (!userData.wallet || userData.wallet < totalAmount)
    ) {
      return res.status(400).json({
        success: false,
        message: `Insufficent Balance`,
      });
    }

      let status =
      paymentMethod === "COD" || paymentMethod == "Wallet"
        ? "placed"
        : "pending";

    const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
    const deliveryDate = delivery
      .toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
      .replace(/\//g, "-");

    const orderIdPrefix = "RZS";
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomOrderId =
      orderIdPrefix +
      Array.from(
        { length: 9 },
        () => randomChars[Math.floor(Math.random() * randomChars.length)]
      ).join("");

    const orderData = new order({
      user_id: user_id,
      delivery_address,
      user_name: userData.username,
      total_amount: req.session.coupon ? req.session.coupon : totalAmount,
      date: Date.now(),
      expected_delivery: deliveryDate,
      payment: paymentMethod,
      order_id: randomOrderId,
      items: cartProducts.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total_price: item.total_price,
        ordered_status: status,
        discountPerItem: item.discountPerItem,
        cancellationReason: item.cancellationReason,
      })),
    });
  

    for (const item of orderData.items) {
      await product.findByIdAndUpdate(item.product_id, {
        $inc: { quantity: -item.quantity },
      });
    }

    if (status === "pending") {
      let cartDelete;
      try {
        cartDelete = await Cart.deleteOne({ user_id: user_id });
      } catch (error) {
        console.error("Error deleting cart:", error);

        return res
          .status(500)
          .json({ success: false, message: "Failed to delete cart" });
      }
    }
    let orders = await orderData.save();
    const orderId = orders._id;
    if (status === "placed") {
      const cartDelete = await Cart.deleteOne({ user_id: user_id });
      res.json({ success: true, orderId });
    } else if (status === "pending") {
      var options = {
        amount: orders.total_amount * 100,
        currency: "INR",
        receipt: orderId,
      };
      instance.orders.create(options, function (err, order) {
        res.send({ status: "razer", order: order, orderId });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const orderConfirmation = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });

    const orderId = req.params.orderId;
    const orderDetails = await order.findById(orderId);
   
    if (!orderDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    if (orderDetails.payment == "RazorPay") {
      orderDetails.items.forEach(async (item) => {
        await order.updateOne(
          { _id: orderId, "items.product_id": item.product_id },
          { "items.$.ordered_status": "placed" }
        );
      });
    }
    res.render("orderConfirmation", {
      orderDetails,
      userData,
      currentUser: req.session.userId,
      
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const loadData = async (req, res) => {
  try {
    const { email } = req.query;
    res.render("otp", { email });
  } catch (error) {}
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

const checkAdd = async (req, res) => {
  try {
    const { name, housename, city, state, phone, pincode } = req.body;

    const newAddress = {
      name,
      housename,
      city,
      state,
      phone,
      pincode,
    };
    await User.findByIdAndUpdate(
      req.session.userId,
      { $push: { address: newAddress } },
      { new: true }
    );
    res
      .status(200)
      .json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const addAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById(userId);

    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    res.render("addAddress", {
      currentUser: userData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  loadHome,
  loadShop,
  loadAbout,
  loadContact,
  loadCheckout,
  placeOrder,

  loadData,
  logout,
  loadSingle,
  loadCheckAdd,
  checkAdd,

  // Login
  loadLogin,
  loadForget,
  forgetPasswordVerify,
  resetPasswordLoad,
  resetpassword,
  loadSign,
  verifySignup,
  verifyOtp,
  verifyLogin,
  resendOTP,
  generateCustomUserId,
  orderConfirmation,
  addAddress
};
