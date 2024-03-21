// const User = require("../model/userModel");
// const coupon = require("../model/coupon");
// const moment = require("moment");
// const mongoose = require("mongoose");
// const path = require("path");
// const fs = require("fs");
// const ejs = require("ejs");
// const puppeteer = require("puppeteer");
// const order = require("../model/order");
// const product = require("../model/product")

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

const loadProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById(userId);

    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    res.render("profile", {
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      currentUser: req.session.userId,
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    res.redirect("/login");
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    console.log(user, "hii");
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      req.flash("error", "Current password is incorrect");
      return res.redirect("/profile");
    }
    if (newPassword !== confirmPassword) {
      req.flash("error", "New password and confirm password do not match");
      return res.redirect("/profile");
    }
    user.password = newPassword;
    await user.save();

    req.flash("success", "Password updated successfully");
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    res.redirect("/profile");
  }
};

const editProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById(userId);

    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    res.render("editProfile", { currentUser: userData });
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    res.redirect("/login");
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username, email, phone } = req.body;

    await User.findByIdAndUpdate(userId, { username, email, phone });

    req.flash("success", "Profile updated successfully");
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    res.redirect("/editProfile");
  }
};



const userOrders = async (req, res) => {
  try {
    const userData = req.session.userId;
    if (userData) {
      const page = parseInt(req.query.page) || 1; 
      const limit = 5;
      const skip = (page - 1) * limit;


      const Orders = await order.aggregate([
        {
          $unwind: { path: "$items",},},
        { $sort: { createdAt: -1,},},
        { $skip: skip }, 
        { $limit: limit }
      ]);
      res.render("userOrders", { Orders, currentUser: req.session.userId, currentPage: page });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};



const laodUsersAddress = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    res.render("address", { Data: userData, currentUser: req.session.userId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
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

const saveAddress = async (req, res) => {
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

const editAddress = async (req, res) => {
  try {
    const addressId = req.query.addressId;
    const userData = await User.findOne({ _id: req.session.userId });
    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    const addressToEdit = userData.address.find(
      (address) => address._id.toString() === addressId
    );
    if (addressToEdit) {
      res.render("editAddress", { addressToEdit, currentUser: userData });
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const saveEditedAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { addressId, name, housename, city, state, phone, pincode } =
      req.body;
    const userData = await User.findById(userId);

    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    const addressToUpdateIndex = userData.address.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressToUpdateIndex === -1) {
      return res.status(404).send("Address not found");
    }

    userData.address[addressToUpdateIndex] = {
      _id: addressId,
      name,
      housename,
      city,
      state,
      phone,
      pincode,
    };
    await userData.save();
    res
      .status(200)
      .json({ success: true, message: "Address updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressIdToDelete = req.params.addressId;
    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      { $pull: { address: { _id: addressIdToDelete } } },
      { new: true }
    );
    res.redirect("/profile/address");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const cancelOrder = async (req, res) => {
  try {
    const { productIds, orderIds } = req.body;
    const data = await order
      .findOneAndUpdate(
        { "items._id": orderIds },
        { $set: { "items.$.ordered_status": "Cancelled" } },
        { new: true }
      )
      .exec();
    const totalPrice = data.total_amount;
    const userId = req.session.userId;
    if (data.payment === "RazorPay" || data.payment === "Wallet" ) {
      await User.findByIdAndUpdate(
        userId,
        { $inc: { wallet: totalPrice } },
        { new: true }
      );
      const walletTransaction = {
        amount: totalPrice,
        type: "credit", 
      };
      const user = await User.findById(userId);
      if (user) {
        user.walletHistory.push(walletTransaction);
        await user.save();
      } else {
        console.log("User not found.");
      }
    }
    for (const item of data.items) {
      const Product = await product.findById(item.product_id);
      if (Product) {
        await product.findByIdAndUpdate(item.product_id, {
          $inc: { quantity: item.quantity },
        });
      }
    }

    return res.status(200).json({ message: "Orders cancelled successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// const calculateTotalPrice = (items, productIds) => {
//   let totalPrice = 0;
//   items.forEach((item) => {
//     if (productIds.includes(item.productId)) {
//       totalPrice += item.price;
//     }
//   });
//   return totalPrice;
// };


const returnOrder = async (req, res) => {
  try {
    const { orderId, productIds } = req.body;

    const data = await order
      .findOneAndUpdate(
        { "items._id": orderId },
        { $set: { "items.$.ordered_status": "Returned" } },
        { new: true }
      )
      .exec();
    const totalPrice = data.total_amount;
    const userId = req.session.userId;

    await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet: totalPrice } },
      { new: true }
    );
    const walletTransaction = {
      amount: totalPrice,
      reason: "Order return refund",
      orderId: data._id,
      timestamp: new Date(),
      type: "credit",
    };
    await User.findByIdAndUpdate(
      userId,
      { $push: { walletHistory: walletTransaction } },
      { new: true }
    );
    return res
      .status(200)
      .json({ message: "Order returned successfully", data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const viewDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const productId = req.query.productId;
    const userId = req.session.userId;

    const orders = await order
      .findOne(
        { _id: orderId, user_id: userId, "items.product_id": productId },
        {
          _id: 1,
          "items.$": 1,
          user_id: 1,
          order_id: 1,
          delivery_address: 1,
          total_amount: 1,
          createdAt: 1,
          updatedAt: 1,
          expected_delivery: 1,
          date: 1,
          payment: 1,
          coupon: 1,
          ordered_status: 1,
        }
      )
      .populate({
        path: "items.product_id",
        model: "product",
      });

    const user = await User.findById(userId);

    let couponDetails = null;
    if (orders && orders.coupon) {
      couponDetails = await coupon.findById(orders.coupon);
      console.log(couponDetails, "details");
    }

    res.render("viewDetails", {
      orders,
      user,
      couponDetails,
      currentUser: req.session.userId,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

const invoiceDownload = async (req, res, next) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      throw new Error("Order ID is missing");
    }
    const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId);
    if (!isValidObjectId) {
      throw new Error("Invalid Order ID");
    }
    const userId = req.session.userId;
    let subTotal = 0;
    const userData = await User.findById(userId);

    const orderData = await order
      .findById(orderId)
      .populate("items.product_id");

    console.log("order:", orderData);

    if (!orderData || !orderData.items || orderData.items.length === 0) {
      throw new Error("Order data or product details not found");
    }

    orderData.items.forEach((item) => {
      const total = item.product_id.price * item.quantity;
      subTotal += total;
    });

    const date = new Date();
    const data = {
      order: orderData,
      user: userData,
      date,
      subTotal,
    };

    const filepathName = path.resolve(__dirname, "../views/user/invoice.ejs");
    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({ format: "Letter" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename= orderInvoice_SHOEZzo.pdf"
    );
    res.send(pdfBytes);
  } catch (error) {
    console.error(error);
    next(error);
  }
};


const wallet = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    const filteredTransactions = user.walletHistory.filter(history => 
      history.type === 'debit' || history.type === 'credit'
    );

    // Pagination
    const page = parseInt(req.query.page) || 1; 
    const perPage = 5; 
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, filteredTransactions.length);
    const totalPages = Math.ceil(filteredTransactions.length / perPage);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    res.render("wallet", { 
      user,
      currentUser: user,
      moment,
      walletTransactions: paginatedTransactions,
      totalPages,
      currentPage: page 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};




module.exports = {
  loadProfile,
  editProfile,
  changePassword,
  updateProfile,
  userOrders,
  viewDetails,
  laodUsersAddress,
  addAddress,
  saveAddress,
  editAddress,
  deleteAddress,
  saveEditedAddress,
  wallet,
  cancelOrder,
  returnOrder,
  invoiceDownload,
};
