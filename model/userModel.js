const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    isAdmin:{
        type:Number,
       default:0
    },
    verified:{
        type:Boolean,
        required:false
    },
    isBlocked:{
        type:Boolean,
        required:false,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const User=mongoose.model('User',userSchema)

module.exports= User
