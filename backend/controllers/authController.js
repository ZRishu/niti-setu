import User from "../models/User.js";

export const register = async (req , res) => {
    try{
        const {name , email , phoneNumber, password, profile, adminSecret } = req.body;
        
        // Normalize string inputs: trim and lowercase email
        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedName = name?.trim();
        const trimmedPhone = phoneNumber?.trim();
        
        const userExists = await User.findOne({ email: trimmedEmail });
        if(userExists){
            return res.status(400).json({ success: false, error: 'User already exists with this email' });
        }

        let role = 'user';
        if (adminSecret) {
            const trimmedSecret = adminSecret.trim();
            if (trimmedSecret === process.env.ADMIN_SECRET) {
                role = 'admin';
            } else {
                return res.status(401).json({ success: false, error: 'Invalid Admin Secret Key' });
            }
        }

        const user = await User.create({
            name: trimmedName, 
            email: trimmedEmail,
            phoneNumber: trimmedPhone,
            password,
            role,
            profile,
        });

        sendTokenResponse(user, 200 , res);
    }
    catch(err){
        // Handle Mongoose Validation Errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages[0] });
        }
        res.status(500).json({ success: false, error: err.message });
    };
};

export const login = async (req, res) => {
    try {
        const {email , password, adminSecret } = req.body;

        if(!email || !password){
            return res.status(400).json({ success: false, error: 'Please provide an email and password' })
        }

        // Normalize string inputs: trim and lowercase email
        const trimmedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: trimmedEmail }).select('+password');
        if(!user){
            return res.status(401).json({success: false, error : 'Invalid credentials' })
        }

        const isMatch = await user.matchPassword(password);
        if(!isMatch){
            return res.status(401).json({ success: false , error: 'Invalid credentials'})
        }

        // Handle Admin Login specific check
        if (adminSecret) {
            const trimmedSecret = adminSecret.trim();
            if (trimmedSecret === process.env.ADMIN_SECRET) {
                if (user.role !== 'admin') {
                    // Use findByIdAndUpdate to bypass validation on the hashed password
                    await User.findByIdAndUpdate(user.id, { role: 'admin' });
                    user.role = 'admin';
                }
            } else {
                return res.status(401).json({ success: false, error: 'Invalid Admin Secret Key' });
            }
        }

        sendTokenResponse(user, 200 , res);

    }
    catch(err){
        res.status(500).json({ success: false, error: err.message });
    }
};

export const getMe = async (req, res) => {
    try{
        const user = await User.findById(req.user.id);
        res.status(200).json({success: true , data: user})
    }catch(err){
        res.status(500).json({success: false, error: err.message});
    }
};

const sendTokenResponse = (user, statusCode , res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile,
            }
        });
}
