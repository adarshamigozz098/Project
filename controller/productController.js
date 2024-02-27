const product = require("../model/product");
const Category = require("../model/category");
const sharp = require("sharp");
const path = require("path");
const { log } = require("console");
const mongoose = require('mongoose');
const fs=require("fs")


const loadProducts = async (req, res) => {
  try {
    const productData = await product.find({});
    res.render("products", { products: productData });
  } catch (error) {
    console.log(error);
  }
};


const loadAddProducts = async (req, res) => {
  try {
    const data = await Category.find({ is_listed: true });
    res.render("addProducts", { category: data });
  } catch (error) {
    console.log(error);
  }
};


const addProducts = async (req, res) => {
  try {
    const existProduct = await product.findOne({ name: req.body.productName });
    if (existProduct) {
      res.status(404).send({ message: "category already exist" });
    } else {
      const {
        productName,
        description,
        quantity,
        price,
        category,
        brand,
        date,
      } = req.body;
      const filenames = [];
      console.log(req.body,"huhhh");
    
      const selectedCategory = await Category.findOne({ name: category });

      if (req.files.length !== 4) {
        return res.render("addProducts", {
          message: "4 images needed",
          category: data,
        });
      }
    
      for (let i = 0; i < req.files.length; i++) {
        const imagesPath = path.join(
          __dirname,
          "../public/sharpImage",
          req.files[i].filename
        );
        console.log(imagesPath);
        await sharp(req.files[i].path)
          .resize(800, 1200, { fit: "fill" })
          .toFile(imagesPath);
        filenames.push(req.files[i].filename);
      }
     
      const newProduct = new product({
        name: productName,
        description,
        quantity,
        price,
        image: filenames,
        category: selectedCategory._id,
        brand: brand,
        date,
      });
      await newProduct.save();

      res.redirect("/admin/products");
    }
  } catch (error) {}
};


const loadEditProduct = async (req, res) => {
  try {
    const productsId = req.query.productsId;
    const data = await product.findOne({ _id: productsId });
    const category = await Category.find({ is_listed: true });

    res.render("editProducts", { products: data, category: category });
  } catch (error) {
    console.log(error);
  }
};



const editProducts = async (req, res) => {
  try {
      const id = req.query.productsId;
      const {productName, description, quantity, price, brand, category} = req.body;

      const selectedCategory = await Category.findOne({name: category});

      if (!selectedCategory) {
          return res.status(404).send({message: "Selected category not found"});
      }

      if (req.files && req.files.length > 4) {
          return res.status(400).send({message: "Maximum 4 images allowed"});
      }

      let updatedProduct = await product.findByIdAndUpdate(
          {_id: id},
          {
              name: productName,
              description,
              quantity,
              price,
              brand,
              category: selectedCategory._id,
          },
          {new: true}
      );

      if (req.files && req.files.length > 0) {
          for (const newImage of req.files) {
              const processedImagePath = path.join(__dirname, "../public/images", `${newImage.filename}_processed`);

              await sharp(newImage.path)
                  .resize(800, 1200, {fit: "fill"})
                  .toFile(processedImagePath);

              updatedProduct.image.push(`${newImage.filename}_processed`);
          }

          updatedProduct = await updatedProduct.save();
      }

      req.flash("message", "Product updated successfully");
      res.redirect("/admin/products");
  } catch (error) {
      console.log(error);
      res.status(500).send({message: "Internal Server Error"});
  }
};


const deleteImage = async (req, res) => {
  try {
    const { productId, image } = req.body; 
    console.log(req.body);
    if (!productId) {
      return res
        .status(400)
        .send({ success: false, error: "Product id is required." });
    }

    const validProductId = mongoose.Types.ObjectId.isValid(productId);
    if (!validProductId) {
      return res
        .status(400)
        .send({ success: false, error: "Invalid product id." });
    }

    if (!image) {
      return res
        .status(400) 
        .send({ success: false, error: "Image is required." });
    }

    
    fs.unlink(path.join(__dirname, "../public/images", image), () => {});

    const aw = await product.updateOne({ _id: productId }, { $pull: { image: image } });
    console.log(aw);

    res.send({ success: true });
    console.log("The image has been deleted.");
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, error: "Failed to delete image." });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const products = req.query.productsId;
    await product.deleteOne({ _id: products });
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};





module.exports = {
  loadProducts,
  loadAddProducts,
  addProducts,
  loadEditProduct,
  editProducts,
  deleteProduct,
  deleteImage,
};