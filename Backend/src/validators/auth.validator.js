import Joi from 'joi';

const authValidator = {
  
    validateRegistration: (req, res, next) => {
        const schema = Joi.object({
            email: Joi.string().email().max(255).required().messages({
                'string.email': 'Please provide a valid email address.',
                'any.required': 'Email is a required field.'
            }),
            username: Joi.string().alphanum().min(3).max(30).required().messages({
                'string.min': 'Username must be at least 3 characters long.',
                'any.required': 'Username is a required field.'
            }),
            phone_number: Joi.string().min(7).max(20).required().messages({
                'any.required': 'Phone number is a required field.'
            }),
            password: Joi.string().min(6).max(100).required().messages({
                'string.min': 'Password must be at least 6 characters long.',
                'any.required': 'Password is a required field.'
            }),
            // Optional field matching your single role mapping layout
            role_id: Joi.string().guid({ version: 'uuidv4' }).optional()
        });

        const { error } = schema.validate(req.body, { abortEarly: true, allowUnknown: false });

        if (error) {
            return res.status(400).json({ 
                success: false, 
                error: error.details[0].message 
            });
        }
        next();
    },

    /**
     * Validates credentials for login endpoints.
     * Allows either username or email authentication workflows.
     */
    validateLogin: (req, res, next) => {
        const schema = Joi.object({
            // Accept username or email for flexible access setups
             email: Joi.string().email().max(255).required().messages({
                'string.email': 'Please provide a valid email address.',
                'any.required': 'Email is a required field.'
            }),
            password: Joi.string().min(6).max(100).required().messages({
                'any.required': 'Password is required.'
            })
        });

        const { error } = schema.validate(req.body, { abortEarly: true, allowUnknown: false });

        if (error) {
            return res.status(400).json({ 
                success: false, 
                error: error.details[0].message 
            });
        }
        next();
    }
};

export default authValidator;