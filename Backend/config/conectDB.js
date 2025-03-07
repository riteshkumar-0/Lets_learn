import mongoose from "mongoose";

mongoose.set('strictQuery',false)

const connectToDB=async ()=>{
  try {
    const {connection}=await mongoose.connect(process.env.MONGODB_URL)
    if(connection){
      console.log("Database connected succsesfully",connection.host)
    }
  } catch (error) {
     console.log("Database connection failed!!")
     process.exit(1)
  }
}

export default connectToDB