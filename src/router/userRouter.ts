import express from 'express';
const router = express.Router();
import { createUser } from '../controller/userController';
import { validate } from '../middleware/validator';
import { createUserSchema } from '../model/userModel';

// Route to create a new user
router.post('/create', validate(createUserSchema), createUser);

// Export the router to be used in the main app
export default router;