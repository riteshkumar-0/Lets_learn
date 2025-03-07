import { Schema,model } from "mongoose";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const userSchema=new Schema(
{
   fullname:{
      type:String,
      required:[true,'Name is required'],
      maxLength:[30,'Name must be below 30 character'],
      lowercase:true,
      trim:true
   },
   email:{
      type:String,
      required:[true,'Email is required'],
      lowercase:true,
      unique:true,
      match:[/^(?:[a-zA-Z0-9_'^&amp;/+-])+(?:\.(?:[a-zA-Z0-9_'^&amp;/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/,
        "please enter valid email"
    ]
   },
   password:{
    type:String,
    required:[true,'password is required'],
    minLength:[6,'password must be above 6 character'],
    select:false
   },
   avatar:{
     public_id:{
        type:String
     },
     secure_url:{
        type:String
     }
   },
   role:{
     type:String,
     enum:['USER','ADMIN'],
     default:'USER'
   },
   forgotPasswordToken:String,
   forgotPasswordExpiry:Date,
   subscription:{
    id:String,
    status:String
   }
},
{
  timestamps:true
})

userSchema.pre('save', async function (next) {
   if (!this.isModified('password')) {
     return next();
   }
   try {
     const salt = await bcrypt.genSalt(10);
     this.password = await bcrypt.hash(this.password, salt);
     next();
   } catch (err) {
     return next(err);
   }
 });

userSchema.methods={
   generateJWTToken:async function(){
       return await jwt.sign(
         {id:this._id,email:this.email,role:this.role,subscription:this.subscription},
         process.env.JWT_SECRET,
         {
            expiresIn:parseInt(process.env.JWT_EXPIRY, 10),
         }
       )
   },
   comparePassword: async function(planeTextPassword){
      console.log("Old password : ",planeTextPassword)
      console.log("current save password : ",this.password)
      try {
        return await bcrypt.compare(planeTextPassword, this.password);
       } catch (error) {
         console.error('Error in comparePassword function:', error);
         throw new Error('Password comparison failed');
       }
   },
   generatePasswordResetToken: async function(){
     // creating a random token using node's built-in crypto module
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Again using crypto module to hash the generated resetToken with sha256 algorithm and storing it in database
    this.forgotPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Adding forgot password expiry to 15 minutes
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;

    return resetToken;
   },
}

const User=model('User',userSchema)

export default User