const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order_id: {
      type: String,
    },
    delivery_address: {
      type: Object,
      
    },
    total_amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    expected_delivery: {
      type: String,
      required: true,
    },
    payment: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
    },
    total: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    couponCode: {
      type: String,
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        total_price: {
          type: Number,
          required: true,
        },
        ordered_status: {
          type: String,
          default: "pending",
        },
        discountPerItem: {
          type: Number,
          default: 0,
        },
        cancellationReason: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const order = mongoose.model("order", orderSchema);
module.exports = order;
