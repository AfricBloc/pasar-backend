import express from 'express';
const router = express.Router();
import { createUser, deleteUser, getAllUsers, getSingleUser, updateUser } from '../controller/userController';
import { validate } from '../middleware/validator';
import { createUserSchema } from '../model/userModel';

// Route to create a new user
router.post('/create', validate(createUserSchema), createUser);
router.get('/user/:id', getSingleUser);
router.get('/users', getAllUsers);
router.get('/delete-user', deleteUser);
router.put('/update-user/:id', validate(createUserSchema), updateUser);

// Export the router to be used in the main app
export default router;