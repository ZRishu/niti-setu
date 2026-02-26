import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const allStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi NCR", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        match: [
            /^[a-zA-Z\s]+$/,
            'Name can only contain letters and spaces'
        ]
    },

    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email with @ and . characters'
        ]
    },

    phoneNumber: {
        type: String,
        required: [true, 'Please add a phone number'],
        match: [
            /^\d{10}$/,
            'Phone number must be exactly 10 digits'
        ]
    },

    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        ],
        select: false
    },
    role: {
        type: String,
        enum: ['user','admin'],
        default: 'user'
    },

    profile: {
        state: { 
            type: String,
            required: [true, 'Please select a state'],
            enum: {
                values: allStates,
                message: 'Please select a valid Indian state or UT from the list'
            }
        },
        district: { 
            type: String,
            match: [
                /^[a-zA-Z\s]+$/,
                'District name can only contain letters and spaces'
            ]
        },
        landHolding: { 
            type: Number,
            min: [0, 'Land holding cannot be negative']
        },
        cropType: { 
            type: String,
            match: [
                /^[a-zA-Z\s]+$/,
                'Crop name can only contain letters and spaces'
            ]
        },
        socialCategory: { 
            type: String, 
            enum: {
                values: ['General', 'OBC', 'SC', 'ST'],
                message: 'Please select a valid social category'
            }
        },
        gender: { 
            type: String, 
            enum: {
                values: ['Male', 'Female', 'Other'],
                message: 'Please select a valid gender'
            }
        },
        age: { 
            type: Number,
            min: [18, 'Age must be at least 18 years'],
            required: [true, 'Please provide your age']
        }
    },
    createdAt: {
        type: Date,
        default : Date.now
    }
});

UserSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password , salt)
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword , this.password);
};

UserSchema.methods.getSignedJwtToken = function(){
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
}

export default mongoose.model('User', UserSchema)
