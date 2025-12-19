const express = require('express')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const User = require('./models/User.schema')
const Note = require('./models/Note.schema')

dotenv.config()

const PORT = process.env.PORT || 8000
const MONGO_URI = process.env.MONGO_URI
const JWT_SECRET = process.env.JWT_SECRET

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((err) => {
    console.log(err)
  })

const app = express()
app.use(express.json())
app.use(cors({
    origin : 'http://localhost:5173'
}))

const verifyToken = (req,res,next) => {
    const token = req.headers['authorization']
    if(!token){
        return res.status(401).json({message:'Unauthorized'})
    }
    const decoded = jwt.verify(token,JWT_SECRET,(err,decoded)=>{
        if(err){
            return res.status(401).json({message:'Unauthorized'})
        }
        req.user = decoded
        next()
    })
}


app.post('/api/register',async (req,res)=>{
    try {
        const existingUser = await User.findOne({
            email : req.body.email
        });
        if(existingUser){
            return res.status(400).json({
                error : 'Email already exists!'
            })
        }

        const hashedPassword = await bcrypt.hash(req.body.password,10);

        const newUser = new User({
            first_name : req.body.first_name,
            last_name : req.body.last_name,
            email : req.body.email,
            password: hashedPassword
        })

        await newUser.save();
        const token = jwt.sign({email : newUser.email},JWT_SECRET);
        return res.status(201).json({
            message : "User registered successfully!",
            token,
            user : newUser
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error : 'Internal server error'
        })
    }
})

app.post('/api/login',async (req,res)=>{
    try {
        const user = await User.findOne({
            email : req.body.email
        });
        if(!user){
            return res.status(400).json({
                error : 'Email not found!'
            })
        }

        const passwordMatch = await bcrypt.compare(req.body.password,user.password)
        if(!passwordMatch){
            return res.status(401).json({error : 'Invalid Credentials!'});
        }

        const token = jwt.sign({email : user.email},JWT_SECRET);
        return res.status(201).json({message:"User Logged In!",token,user});

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error : 'Internal server error'
        })
    }
})

app.get('/api/user',verifyToken,async (req,res)=>{
    try {
        
        const user = await User.findOne({
            email : req.user.email
        });
        if(!user){
            return res.status(400).json({
                error : 'Email not found!'
            })
        }
        return res.status(201).json({user});
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error : 'Internal server error'
        })
    }
})

// Note Routes
app.get('/api/notes', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const notes = await Note.find({ userId: user._id }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/notes', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const newNote = new Note({
            title: req.body.title || 'Untitled',
            content: req.body.content || '',
            userId: user._id
        });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/notes/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const note = await Note.findOne({ _id: req.params.id, userId: user._id });
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/notes/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { 
                title: req.body.title,
                content: req.body.content
            },
            { new: true }
        );
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/notes/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: user._id });
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})