import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

import 'dotenv/config'
import authRoutes from './routes/authRoutes.js';



const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL, // frontend URL
  credentials: true // <- must for cookies
}));
app.use(express.json())
app.use(cookieParser())

app.get('/',(req,res)=>{
    res.send('Streamwave server is running ')
})

app.use('/api/auth',authRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})