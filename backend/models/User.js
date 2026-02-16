import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    
    email: {
        type: String,
        required: [true, `Please add a email`],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
        ]
    },

    // dont return pass in api response
    password: {
        type: String,
        required: [true, `Please add a password`],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user','admin'],
        default: user
    },

    // the user's profile for personalized scheme search
    profile: {
        state: {type: string},
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        caste: { type: String, enum: ['General', 'OBC', 'SC', 'ST'] },
        age: { type: Number },
        occupation: { type: String }
    },
    createdAt: {
        type: Date,
        default : Date.now
    }
});

// encrypting pass before saving 
UserSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password , salt)
});

// matching pass and hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword , this.password);
};

// generating and returning jwt token
UserSchema.methods.getSignedJwtToken = function(){
    return jwt.sign({ id: this._id }, processe.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
}

export default mongoose.model('User', UserSchema)

