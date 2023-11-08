const router = require('express').Router();
const {Product} = require('../models/product');
const { Category } = require('../models/category');
const mongoose = require('mongoose');
const multer  = require('multer')
const path = require('path')

const FILE_TYPE_MAP = {
    'image/png':'png',
    'image/jpeg':'jpeg',
    'image/jpg':'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValidFile = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Please upload PNG,JPEG or JPG image only')

        if(isValidFile){
            uploadError = null;
        }
      cb(uploadError, path.join(__dirname, '../public/upload'))
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.replace(' ','-');
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })

const upload = multer({storage:storage})
//get product by id
router.get('/:id',async (req,res)=>{
    const product = await Product.findById(req.params.id).populate('category');
    if(!product) return res.status(500).json({message:"The product with the given Id not found!"});
    res.status(200).send(product);
});

//get all products
router.get('/',async (req,res)=>{
    let filter = {};
    if(req.query.category){
        filter = {category:req.query.category.split(',')};
    }
    const productList = await Product.find(filter).populate('category');
    if(!productList){
        res.status(500).json({success:false});
    }
    res.send(productList);
});

// create product
router.post('/',upload.single('image'),async (req,res)=>{
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(404).json("Invalid category");

    if(!req.file){
        return res.status(400).send('No product image found')
    }
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock:req.body.countInStock,
        rating:req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        dateCreated: req.body.dateCreated,
    })
    product = await product.save();
    if(!product) return res.status(500).send('The product cannot be created!');
    res.send(product);
});

//update product
router.put('/:id',upload.single('image'),async(req,res)=>{
    if(!mongoose.isValidObjectId(req?.params?.id))return res.status(400).send("Invalid product id");
    const category = await Category.findById(req?.body?.category);
    if(!category) return res.status(404).send("Invalid category");

    const selectedProduct = Product.findById(req.params.id) 
    if(!selectedProduct)return res.status(400).send("Invalid Product!");

    const file = req?.file;
    let imagePath;
    if(file){
        const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
        imagePath = `${basePath}${file.filename}`
    }else{
        imagePath = selectedProduct.image;
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock:req.body.countInStock,
            rating:req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            dateCreated: req.body.dateCreated,
        },
        {new:true});
    if(!product)return res.status(400).send("The product cannot be updated");
    res.status(201).send(product);
})

//delete product
router.delete('/:id',(req,res)=>{
    Product.findByIdAndRemove(req.params.id).then((product)=>{
        if(product){
            res.status(200).json({success:true,message:'The product is deleted'});
        }else{
            res.status(404).json({success:false,message:'Product not found!'})
        }
    }).catch((err)=>{
        return res.status(400).json({success:false,error:err})
    })
})

//get products count  /get/count
router.get('/get/count',async (req,res)=>{
    const count = await Product.count();
    if(!count) return res.status(500).json({success:false});
    res.send({count:count});
});

//get featured products    /get/featured
router.get('/get/featured',async (req,res)=>{
    const featured = await Product.find({isFeatured:true});
    if(!featured) return res.status(500).json({success:false});
    res.send(featured);
});

//add product multiple images
router.put('/productImages/:id',upload.array('images'),async(req,res)=>{
    if(!mongoose.isValidObjectId(req.params.id))return res.status(400).send("Invalid product id");

    const files = req.files
    let imageArray = []
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
    if(files){
        files.map(file=>{
            imageArray.push(`${basePath}${file.filename}`)
        })
    }
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imageArray
        },
        {new:true});

    if(!product)return res.status(400).send("Images cannot be updated");
    res.status(201).send(product);
})
module.exports = router;

