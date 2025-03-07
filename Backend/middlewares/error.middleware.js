const errorMiddeleware=(err,req,res)=>{
    err.statusCode=err.statusCode || 500
    err.message=err.message || "Something went wrong"
   res.status().json({
     succsess:false,
     message:err.message,
     stack:err.stack
   })
};

export default errorMiddeleware