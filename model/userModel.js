const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true,
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
        // required:false,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }, address: [
        {
            name: {
                type: String,
            },
            housename: {
                type: String,
            },
            city: {
                type: String,
            },
            state: {
                type: String,
            },
            phone: {
                type: String, 
            },
            pincode: {
                type: Number,
            },
        },
    ],
    wallet: {
        type: Number,
        default: 0
      },
      walletHistory: [{
        date: {
          type: Date
        },
        amount: {
          type: Number,
        },
        reason: {
          type: String,
        }
    
      }],
})
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User=mongoose.model('User',userSchema)

module.exports= User
