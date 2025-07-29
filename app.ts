import express from 'express';
const app = express();
import dotenv from 'dotenv';
dotenv.config();
import userRouter from './src/router/userRouter';

app.use(express.json());
app.use('/api', userRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});