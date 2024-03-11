const User = require("../model/userModel");
const product = require("../model/product");
const Cart = require("../model/cart");

const config = require("../config/config");
const mongoose = require("mongoose");

const order = require("../model/order");
const { connections } = require("mongoose");
const category = require("../model/category");




const loadCart = async (req, res) => {
    try {
      const userId = req.user ? req.user._id : null;
      const userCart = await Cart.findOne({ user_id: userId }).populate(
        "items.product_id"
      );
      const cartProducts = userCart ? userCart.items : [];
      const totalPriceSum = cartProducts.reduce(
        (sum, item) => sum + item.total_price,
        0
      );
  
      res.render("cart", {
        cartProducts,
        totalPriceSum,
        currentUser: req.session.user_id,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const addToCart = async (req, res) => {
    try {
      console.log("Add to cart request received ", req.body);
      const userId = req.user._id;
      const productId = req.body.productId;
      const quantity = req.body.quantity;
      console.log(productId);
      console.log(quantity);
      console.log(userId);
  
      let userCart = await Cart.findOne({ user_id: userId });
  
      if (!userCart) {
        userCart = new Cart({
          user_id: userId,
          items: [],
        });
      }
  
      const existingProductIndex = userCart.items.findIndex(
        (item) => item.product_id.toString() === productId
      );
  
      if (existingProductIndex !== -1) {
        console.error(`Product with id ${productId} is already in the cart.`);
        return res
          .status(400)
          .send(`Product with id ${productId} is already in the cart.`);
      }
  
      const productToAdd = await product.findById(productId);
      if (!productToAdd) {
        console.error(`Product with id ${productId} not found.`);
        return res.status(404).send(`Product with id ${productId} not found.`);
      }
  
      if (quantity > productToAdd.quantity) {
        console.error(
          `Requested quantity exceeds available quantity for product ${productId}`
        );
        return res
          .status(400)
          .send(
            `Requested quantity exceeds available quantity for product ${productId}`
          );
      }
  
      userCart.items.push({
        product_id: productId,
        quantity: quantity,
        price: productToAdd.price,
        total_price: quantity * productToAdd.price,
      });
  
      await userCart.save();
      const cartTotals = userCart.items.reduce(
        (sum, item) => sum + item.total_price,
        0
      );
      res.render("cart", {
        cartProducts: userCart.items,
        totalPriceSum: cartTotals,
        currentUser: req.session.user_id,
      });
    } catch (error) {
      console.error("Error adding product to cart:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  



const increaseQuantity = async (req, res) => {
  try {
    const { productId, quantity, itemId } = req.body;
    const userId = req.session.userId;

    const cartItem = await Cart.findOne({ user_id: userId }).populate('items.product_id');

    if (!cartItem) {
      return res.status(404).json({ success: false, error: 'Cart not found for the user' });
    }

    const itemIndex = cartItem.items.findIndex(item => item.product_id.equals(productId));
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Product not found in cart' });
    }

    const Product = await product.findById(productId); 
    if (!Product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (quantity > Product.quantity) { 
      return res.status(400).json({ success: false, error: 'Requested quantity exceeds available quantity' });
    }

    cartItem.items[itemIndex].quantity = quantity;

    const currentPrice = cartItem.items[itemIndex].price;
    const newTotalPrice = currentPrice * quantity;
    cartItem.items[itemIndex].total_price = newTotalPrice;

    await cartItem.save(); 

    Product.quantity = Product.quantity - (quantity - cartItem.items[itemIndex].quantity); 
    await Product.save(); 

    return res.json({ success: true, message: 'Quantity and total_price updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};




const removeProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.body.productId;

    const userCart = await Cart.findOne({ user_id: userId });
    if (!userCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    userCart.items = userCart.items.filter(
      (item) => item.product_id.toString() !== productId
    );

    await userCart.save();

    res.json({ success: true, message: "Product removed from cart" });
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



module.exports ={
    loadCart,
    addToCart,
    removeProduct,
    increaseQuantity,

}