import AppError from '../utils/error.utils.js'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

const isLoggedIn=async function (req,res,next){
   try {
    const {token}=req.cookies
    console.log("Req.cookies in auth ",req.cookies)
    if(!token){
        return next(new AppError("Unautheticated,please logged in",401))
    }

    const userDetails= await jwt.verify(token,process.env.JWT_SECRET)
    
    req.user=userDetails
    console.log(req.user)
    next()
   } catch (error) {
    return next(new AppError("Unautheticated,please logged in",401))
   }
}

const authorizedRoles=(...roles)=> async (req,res,next)=>{
   try {
    const currentUserRole=req.user.role
    if(!roles.includes(currentUserRole)){
     return next(new AppError("You do not have permission to this route",400))
    }
    next()
   } catch (error) {
     return next(new AppError("You do not have permission to this route",400))
   }
}

const authorizeSubscriber=async(req,res,next)=>{
    const {id}=req.user
    if (!id) {
        return next(new AppError("User id is missing",400))
    }
    const user= await User.findById(id)
    if (!user) {
        return next(new AppError("User information is missing",400))
    }

   const subscription=user.subscription
   const currentUserRole=user.role
   if(currentUserRole!=='ADMIN' && subscription.status!=='active'){
    return next(new AppError("Please first subscribe to access course lectures",403))
   }
   next()
}

export{
    isLoggedIn,
    authorizedRoles,
    authorizeSubscriber
}