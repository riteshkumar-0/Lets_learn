import Payment from "../models/payment.model.js"
import User from "../models/user.model.js"
import { razorpay } from "../server.js"
import AppError from "../utils/error.utils.js"
import crypto from 'crypto'

const getRazorpayApiKey=async(req,res,next)=>{
    res.status(200).json({
        succsess:true,
        message:"Razorpay Api Keys is",
        key:process.env.RAZORPAY_API_KEY
    })
}
const buySubscription=async(req,res,next)=>{
   try {
     const {id}=req.user
     const user=await User.findById(id)
     if(!user){
         return next(new AppError("Unautharized,please login"),400)
     }
 
     if(user.role=='ADMIN'){
         return next(new AppError("Admin cannot purchase subscription"),400)
     }
 
     const subscription=await razorpay.subscription.create({
         plan_id:process.env.RAZORPAY_PLAN_KEY,
         costomer_notify:1
     })
 
     user.subscription.id=subscription.id
     user.subscription.status=subscription.status
 
     await user.save()
 
     res.status(200).json({
         succsess:true,
         message:"Razorpay Api Keys is",
         subscription_id:subscription_id
     })
   } catch (error) {
     return next(new AppError("Failed to subscribe,Try again"),400)
   
   }

}
const verifySubscription=async(req,res,next)=>{
    try {
        const {id}=req.user
        const {razorpay_payment_id,razorpay_signature,razorpay_subscription_id}=req.body
        
        const user=await User.findById(id)
        if(!user){
            return next(new AppError("Unautharized,please login"),400)
        }
    
        const subscriptionId=req.user.subscription.id
    
        const generatedSignature=crypto
        .createHmac('sha256',process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id}|${subscriptionId}`)
        .digest('hex')
    
        if(generatedSignature!==razorpay_signature){
            return next(new AppError("Payment not verified,Try again"),500)
        }
    
        await Payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id
        })
    
        user.subscription.status='active'
        await user.save()
    
        res.status(200).json({
            succsess:true,
            message:"Payment verified succsesfully",
        })
    } catch (error) {
        return next(new AppError("Payment not verified,Try again"),500)

    }
    
}
const cancelSubscription=async(req,res,next)=>{
    try {
        const {id}=req.user;
        const user=await User.findById(id)
    
        if(!user){
            return next(new AppError("Unautharized,please login"),400)
        }
    
        if(user.role=='ADMIN'){
            return next(new AppError("Admin cannot purchase subscription"),400)
        }
    
        const userSubscriptionId=req.user.subscription.id
        const subscription=await razorpay.subscriptions.cancel(userSubscriptionId)
    
        user.subscription.status=subscription.status
        await user.save()
    } catch (error) {
        return next(new AppError(`"Failed to cancel subscription  : " ${error}`),400)

    }
}


const allPayments=async(req,res,next)=>{
    try {
        const {count}=req.query
    
        const subscription=await razorpay.subscriptions.all({
            count: count || 10,
        });
    
        res.status(200).json({
            success:true,
            message:"All payments",
            subscription
        })
    } catch (error) {
        return next(new AppError(`Failed to get all payments : ${error}`))
    }
}


export{
    allPayments,
    cancelSubscription,
    getRazorpayApiKey,
    buySubscription,
    verifySubscription
}