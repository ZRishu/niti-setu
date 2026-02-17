import User from "../models/User.js";

export const register = async (req , res) => {
    try{
        const {name , email , phoneNumber, password, profile, adminSecret } = req.body;

        const userExists = await User.findOne({ email });
        if(userExists){
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        let role = 'user';
        if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
            role = 'admin';
        }

        const user = await User.create({
            name, 
            email,
            phoneNumber,
            password,
            role,
            profile,
        });

        sendTokenResponse(user, 200 , res);
    }
    catch(err){
        res.status(500).json({ success: false, error: err.message });
    };
};

export const login = async (req, res) => {
    try {
        const {email , password } = req.body;

        if(!email || !password){
            return res.status(400).json({ success: false, error: 'Please provide an email and password' })
        }

        const user = await User.findOne({ email }).select('+password');
        if(!user){
            return res.status(401).json({success: false, error : 'Invalid credentials' })
        }

        const isMatch = await user.matchPassword(password);
        if(!isMatch){
            return res.status(401).json({ success: false , error: 'Invalid credentials'})
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
