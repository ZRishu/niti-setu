import User from "../models/User.js";

// register user
// route   POST /api/v1/auth/register
// access  public
export const register = async (req , res) => {
    try{
        const {name , email , password, profile } = req.body;

        const userExists = await User.findOne({ email });
        if(userExists){
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        let role = 'user';
        if (adminSecret === process.env.ADMIN_SECRET) {
            role = 'admin';
        }

        const user = await User.create({
            name, 
            email,
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


// Login User
//route  POST /api/v1/auth/login
// access Public

export const login = async (req, res) => {
    try {
        const {email , password } = req.body;

        if(!email || !password){
            return res.status(400).json({ success: false, error: 'Please provide an email and password' })
        }

        const user = await User.findOne({ email }).select('+password');
        if(!user){
            return res.status(401).json({success: false, error : 'Invalid credentails ' })
        }

        const isMatch = await user.matchPassword(password);
        if(!isMatch){
            return res.status(401).json({ success: false , error: 'Invalid credentails'})
        }

        sendTokenResponse(user, 200 , res);

    }
    catch(err){
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get current logged in user
// route GET /api/v1/auth/me 
// access private

export const getMe = async (req, res) => {
    try{
        const user = await User.findById(req.user.id);
        res.status(200).json({success: true , data: user})
    }catch(err){
        res.status(500).json({success: false, error: err.message});
    }
};

//Helper function to get Token from model , create cookies and send response
const sendTokenResponse = (user, statusCode , res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true // Cookie cannot be accessed by client side JS (Security)
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
                role: user.role,
                profile: user.profile,
            }
        });
}

