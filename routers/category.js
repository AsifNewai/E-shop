const router = require('express').Router();
const {Category} = require('../models/category');

// get all categories
router.get('/',async (req,res)=>{
    const categoryList = await Category.find();
    if(!categoryList){
        res.status(500).json({success:false});
    }
    res.status(200).send(categoryList);
});

// get category by id
router.get('/:id',async (req,res)=>{
    const category = await Category.findById(req.params.id);
    if(!category)res.status(500).json({message:"The category with the given Id was not found."});
    res.status(200).send(category);
});

// update category
router.post('/:id',async (req,res)=>{
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name:req.body.name,
            icon:req.body.icon,
            color:req.body.color
        },
        {new:true});
    if(!category)res.status(400).send('The category cannot be updated');
    res.status(201).send(category);
})

// create category
router.post('/',async (req,res)=>{
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
    });
    category = await category.save();
    if(!category)return res.status(404).send('The category cannot be created!');
    res.send(category);
});

// delete category
router.delete('/:id',(req,res)=>{
    Category.findByIdAndRemove(req.params.id).then((result) => {
        if(result){
            return res.status(200).json({success:true,message:'The category is deleted!'});
        }else{
            return res.status(404).json({success:false,message:'Category not found!'})
        }
    }).catch((err) => {
        return res.status(400).json({success:false,error:err});
    });
});

module.exports = router;
