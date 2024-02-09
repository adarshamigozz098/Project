
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    image: {
        type: [],
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'category',
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        default: Date.now()
    },
    is_listed: {
        type: Boolean,
        default: true
    }
})


const product = mongoose.model('product', productSchema)
module.exports = product