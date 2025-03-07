import User from "../models/user.model.js"
import clodinary from 'cloudinary'
import AppError from "../utils/error.utils.js"
import fs from 'fs/promises'
import sendEmail from "../utils/sendEmail.utils.js"
import crypto from 'crypto'
import asyncHandler from "../middlewares/asyncHandler.middleware.js"

const cookieOption={
    maxAge:7*60*60*60*1000,
    httpOnly:true,
    secure:true
}

const register=async (req,res,next)=>{
    try {
        const {fullname,email,password}=req.body
        if(!fullname || !email || !password){
            return next(new AppError("Every field is required",400))
        }
        const userExists=await User.findOne({email})
        if(userExists){
            return next(new AppError("User already exists with this email!",400))
        }
        
        const user=await User.create({
            fullname,
            email,
            password,
            avatar:{
                public_id:email,
                secure_url:"https://cloudinary.com/"
            }
            
        })
    
        if(!user){
            return next(new AppError("User registration failed try again!",400))
        }
    
       // console.log("File detailed -> ",JSON.stringify(req.file));
    
        if(req.file){
            try {
                const result= await clodinary.v2.uploader.upload(req.file.path,{
                    folder:'lms',
                    width:250,
                    height:250,
                    gravity:"faces",
                    crop:'fill'
    
                })
                if(result){
                    user.avatar.public_id=result.public_id
                    user.avatar.secure_url=result.secure_url
    
                   fs.rm(`uploads/${req.file.filename}`)
                }
            } catch (error) {
                return next(error || new AppError("Failed to upload profile image",400))
            }
        }
    
    
        await user.save();
        user.password=undefined
    
        const token= await user.generateJWTToken()
    
        res.cookie('token',token,cookieOption)
    
        res.status(200).json({
            success:true,
            message:"User registerde succsesfull",
            user
        })
    } catch (error) {
        next(error || new AppError("User registration failed,try again",400))
    }
}

const login=async function (req,res,next){
   try {
    const {email,password}=req.body
    if(!email || !password){
      return next(new AppError("All fields ar required",400))
    }
    const user=await User.findOne({email}).select('+password')

    // console.log("User login ",user)
 
    if(!user){
     return next(new AppError("Email doesnt exists",400))
    }

    const isValidPassword=await user.comparePassword(password)
    if(!isValidPassword){
     return next(new AppError("password incorrect",400))
    }
 
    const token= await user.generateJWTToken();
    user.password=undefined
    // console.log("Token generated at Login time ",token)
    res.cookie('token',token,cookieOption)
 
    res.status(200).json({
      success:true,
      message:'User loged in succsesfully..',
      user
    })
   } catch (error) {
      return next(new AppError("Error during user login",400))
   }

}

const logout=(req,res)=>{
   res.cookie('token',null,{
     maxAge:0,
     httpOnly:true,
     secure:true
   })

   res.status(200).json({
    success:true,
    message:"User loged out succesfully",
   })
}

const getProfile=async function (req,res,next){
     try {
        const userId=req.user.id;

        console.log("User Details : ",req.user)

        const user=await User.findById(userId)

        
        res.status(200).json({
            succsess:true,
            message:"Profile details",
            user
            })
        console.log(user)
        
     } catch (error) {
        return next(new AppError("Failed to fetch profile",400))
     }
}

const forgotPassword=asyncHandler(async function (req,res,next){
    const {email}=req.body

    console.log("Eamil from body : ",email)
    if(!email){
        return next(new AppError("Email is required",400))
    }
    const user=await User.findOne({email})
    if(!user){
        return next(new AppError("Email not register",400))
    }
    // console.log("Yaha tak sahi hai")

    const resetToken=await user.generatePasswordResetToken()
   // console.log("Reset Token generated : ",resetToken)

    await user.save()
   // console.log(user)
    const resetPasswordUrl=`${process.env.FRONTEND_URL}/reset-password`

 //   console.log("Reset URL",resetPasswordUrl)

    const subject='Reset password'
    const message=`You can reset your password by clicking below link <br/> <a href=${resetPasswordUrl} target='_main'> ${resetPasswordUrl} <a/>`
    
   // console.log("Done*******")

    try {
       // console.log("Before sendEmail")
        await sendEmail(email,subject,message)
      //  console.log("After sendEmail")

       // console.log('User : ',user)

        res.status(200).json({
            success:true,
            message:`Reset token has been sent at ${email}`,
            User:user,
            resetToken:resetToken
        })
    } catch (error) {
        user.forgotPasswordExpiry=undefined
        user.forgotPasswordToken=undefined
        await user.save()
        return next(`"Error in forgotong password" : ${error}` || new AppError(error,400))
    }
   
})



const resetPassword=async (req,res,next)=>{
    const {resetToken}=req.params
    const {password}=req.body

    const forgotPasswordToken=crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

    const user=await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry:{$gt:Date.now()}
    });
    if(!user){
        return next(new AppError("Token is invalid or expire, please try again"),400)
    }

    user.password=password
    user.forgotPasswordToken=undefined
    user.forgotPasswordExpiry=undefined
    await user.save()

    res.status(200).json({
        success:true,
        message:"Password changed succsesfully"
    })
}

const changePassword=async function(req,res,next){
   const userId=req.user.id;
   console.log("User Id req.user.id ",userId)
   const {oldPassword,newPassword}=req.body
   console.log("Req body : ",req.body)

   if(!oldPassword || !newPassword){
    return next(new AppError("All fields arr mandeteray",400))
   }
   const user=await User.findById(userId).select('+password')
   if(!user){
     return next(new AppError("User doesn`t exists",400))
   }
   console.log("yaha tak")

   const isValidPassword=await user.comparePassword(oldPassword)
    if(!isValidPassword){
     return next(new AppError("password mismatch",400))
    }

   user.password=newPassword
   await user.save()
   user.password=undefined

   res.status(200).json({
     success:true,
     message:"Password changed Succesfully",
     user
   })
}

const updateUser=async(req,res,next)=>{
   try {
     const {id}=req.user
     const {fullname} =req.body

     console.log("Id of User ",id)
     console.log("fullname of User ",fullname)
 
     const user=await User.findById(id)
     if(!user){
         return next(new AppError("User doesnt exists",400))
     }
     if(!fullname){
         return next(new AppError("Fullname is empty ",400))
     }

     console.log("User finded : ",user)
 
     user.fullname=fullname
 
     if(req.file){
         await clodinary.v2.uploader.destroy(user.avatar.public_id)
         try {
             const result= await clodinary.v2.uploader.upload(req.file.path,{
                 folder:'lms',
                 width:250,
                 height:250,
                 gravity:"faces",
                 crop:'fill'
 
             })
             if(result){
                 user.avatar.public_id=result.public_id
                 user.avatar.secure_url=result.secure_url
 
                fs.rm(`uploads/${req.file.filename}`)
             }
         } catch (error) {
             return next(error || new AppError("Failed to upload profile image",400))
         }
     }
    const updatedUser=await user.save()

    console.log("Updated User",updateUser)
 
     res.status(201).json({
         success:true,
         message:"Profile udated succesfully",
         updatedUser
     })
   } catch (error) {
    return next(error || new AppError("Failed to update profile",400))
   }
}


export{
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,updateUser
}