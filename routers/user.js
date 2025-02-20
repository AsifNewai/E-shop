const router = require('express').Router();
const {User} = require('../models/user');
const CryptoJS = require("crypto-js");
const jwt = require('jsonwebtoken');
require('dotenv/config');

//http://localhost:3000/user/login direct login/register url

// get all users
router.get('/',async (req,res)=>{
    const userList = await User.find().select('-passwordHash');
    if(!userList){
        res.status(500).json({success:false});
    }
    res.send(userList);
});

// get user by id
router.get('/:id',async (req,res)=>{
    const user = await User.findById(req.params.id).select('-passwordHash');
    if(!user)res.status(500).json({message:"The user with the given Id was not found."});
    res.status(200).send(user);
});

// create user
router.post('/',async (req,res)=>{
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: CryptoJS.AES.encrypt(req.body.password,process.env.SECRET_KEY).toString(),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zipCode: req.body.zipCode,
        city: req.body.city,
        country: req.body.country,
    });
    user = await user.save();
    if(!user)return res.status(404).send('The user cannot be created!');
    res.status(200).send(user);
});

// update user
router.put('/:id',async (req,res)=>{
    let newPassword;
    if(req.body.password){
        newPassword = CryptoJS.AES.encrypt(req.body.password,'eshop-hash-password').toString()
    }else{
        let userExist = await User.findById(req.params.id);
        newPassword = userExist.passwordHash
    }
    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zipCode: req.body.zipCode,
            city: req.body.city,
            country: req.body.country,
        },
        {new:true}).select('-passwordHash');
    if(!user)res.status(400).send('The user cannot be updated');
    res.status(201).send(user);
})

// delete user
router.delete('/:id',(req,res)=>{
    User.findByIdAndRemove(req.params.id).then((result) => {
        if(result){
            return res.status(200).json({success:true,message:'The user is deleted!'});
        }else{
            return res.status(404).json({success:false,message:'User not found!'})
        }
    }).catch((err) => {
        return res.status(400).json({success:false,error:err});
    });
});

// login user
router.post('/login',async (req,res)=>{
    const user = await User.findOne({email:req.body.email});

    if(!user) return res.status(400).send('The user not found!');
    let decrypted  = CryptoJS.AES.decrypt(user.passwordHash,process.env.SECRET_KEY);
    if(user && decrypted.toString(CryptoJS.enc.Utf8) === req.body.password){
        const token = jwt.sign({userId : user._id,isAdmin:user.isAdmin},process.env.SECRET_KEY,{expiresIn:'1d'})
        res.status(200).send({email:user.email,token:token});
    }else{
        res.status(400).send('Password wrong');
    }
})

// register user
router.post('/register',async (req,res)=>{
    const alreadyExist = await User.findOne({email:req.body.email});
    if(alreadyExist && alreadyExist.email == req.body.email)return res.status(401).json({message:'Email already exist'});
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: CryptoJS.AES.encrypt(req.body.password,process.env.SECRET_KEY).toString(),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zipCode: req.body.zipCode,
        city: req.body.city,
        country: req.body.country,
    });
    user = await user.save();
    if(!user)return res.status(404).send('The user cannot be register!');
    res.status(200).send(user);
});

// get users count
router.get('/get/count',async (req,res)=>{
    const count = await User.count();
    if(!count) return res.status(500).json({success:false});
    res.send({count:count});
});

module.exports = router;