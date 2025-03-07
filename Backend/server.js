import app from './app.js'
import connectToDB from './config/conectDB.js'
import cloudinary from 'cloudinary'
import {config} from 'dotenv'
import Razorpay from 'razorpay'
config()

cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUDE_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});

export const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_API_KEY,
    key_secret:process.env.RAZORPAY_SECRET
})


const port=process.env.PORT || 8009

app.listen(port,async()=>{
    await connectToDB()
    console.log(`App is runnig at localhost://${port}`)
})