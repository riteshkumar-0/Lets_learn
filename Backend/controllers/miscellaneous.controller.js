import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import User from '../models/user.model.js';
import AppError from '../utils/error.utils.js';
import sendEmail from '../utils/sendEmail.utils.js';

/**
 * @CONTACT_US
 * @ROUTE @POST {{URL}}/api/v1/contact
 * @ACCESS Public
 */



export const fun=(req,res,next)=>{
   res.send("Fun is live")
}

export const contactUs=async (req,res,next)=>{
  try {
     const {name,email,message} =req.body
  
     console.log("Body data : ",req.body)
  
     if(!name || !email || !message){
      return next(new AppError("All fields are required",400))
     }
     const subject=`Contact Us`
     const emailMessage=`${name } - ${email} <br/> ${message}`
     await sendEmail(email,subject,emailMessage)
  
     res.status(200).json({
       success:true,
       message:"Form submitted succesfully"
     })
  } catch (error) {
    return next(new AppError(`Failed to submit form ${error}`,400))
  }
}

/**
 * @USER_STATS_ADMIN
 * @ROUTE @GET {{URL}}/api/v1/admin/stats/users
 * @ACCESS Private(ADMIN ONLY)
 */
export const userStats = asyncHandler(async (req, res, next) => {
  const allUsersCount = await User.countDocuments();

  const subscribedUsersCount = await User.countDocuments({
    'subscription.status': 'active', // subscription.status means we are going inside an object and we have to put this in quotes
  });

  res.status(200).json({
    success: true,
    message: 'All registered users count',
    allUsersCount,
    subscribedUsersCount,
  });
});