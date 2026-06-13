import AppError from "../utils/errorHandling";

const gateMiddleware=(req,res,next)=>{

try{
    const gateStatus=req.gateStatus;
    if(gateStatus==='closed'){
        // return res.status(503).json({
        //     success:false,
        //     message:'The trading gate is currently closed. Please try again later.'
        // });
           throw new AppError('The trading gate is currently closed. Please try again later.', 400);


    }
    next();


}catch(error){  
    
    next(error);

}

}