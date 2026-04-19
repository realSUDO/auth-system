import z from "zod";
// validation schema...

export const signUpSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
	name: z.string().optional(),
});

export const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

// middleware factory for validating req bodies...

export const validate = (schema) =>(req, res, next) => {
	try {
		req.validateBody = schema.parse(req.body); 
		next();
	}
	catch (err) {
		res.status(400).json({error: 'Validation failed', details: err.errors});
	}
};

