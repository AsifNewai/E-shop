const router = require('express').Router();
const { populate } = require('dotenv');
const {Order} = require('../models/order');
const { OrderItem } = require('../models/order-item');

// get all orders
router.get('/',async (req,res)=>{
    const orderList = await Order.find().populate('user','name').sort({'dateOrdered': -1});
    if(!orderList){
        res.status(500).json({success:false});
    }
    console.log("hi")
    res.send(orderList);
});

// get order by id
router.get('/:id',async (req,res)=>{
    const order = await Order.findById(req.params.id)
    .populate('user','name')
    .populate({
        path: 'orderItems',populate: {
            path: 'product',populate:'category'}
        });
    if(!order)res.status(500).json({message:"The order with the given Id was not found."});
    res.status(200).send(order);
});

// create Order
router.post('/',async (req,res)=>{
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))
    const orderItemsIdsResolved = await orderItemsIds

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product','price');
        return orderItem.product.price * orderItem.quantity
    }))

    const totalPrice = totalPrices.reduce((a,b)=>a+b,0)

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    });
    order = await order.save();
    if(!order)return res.status(404).send('The order cannot be created!');
    res.send(order);
});

// update orders
router.put('/:id',async (req,res)=>{
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status:req.body.status
        },
        {new:true});
    if(!order)res.status(400).send('The order cannot be updated');
    res.status(201).send(order);
})

// delete order
router.delete('/:id',(req,res)=>{
    Order.findByIdAndRemove(req.params.id).then(async (result) => {
        if(result){
            await result.orderItem.map(async (orderItem)=>{
                await OrderItem.findByIdAndRemove(orderItem);
            })
            return res.status(200).json({success:true,message:'The order is deleted!'});
        }else{
            return res.status(404).json({success:false,message:'Order not found!'})
        }
    }).catch((err) => {
        return res.status(400).json({success:false,error:err});
    });
});

// get total sales
router.get('/get/totalsales',async (req,res)=>{
    const totalSales = await Order.aggregate([{
        $group : {_id:null,totalsales : {$sum : '$totalPrice'}}
    }])
    if(!totalSales){
        return res.send(400).send('The order sales cannot be generated')
    }
    res.send({totalSales:totalSales.pop().totalsales})
});

//get order count  /get/count
router.get('/get/count',async (req,res)=>{
    const count = await Order.count();
    if(!count) return res.status(500).json({success:false});
    res.send({count:count});
});

// get user orders history list
router.get('/get/userorders/:id',async (req,res)=>{
    const userOrderList = await Order.find({user:req.params.id}).populate({
        path: 'orderItems',populate: {
            path: 'product',populate:'category'}
        });
    if(!userOrderList){
        res.status(500).json({success:false});
    }
    res.send(userOrderList);
});

module.exports = router;