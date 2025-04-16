const express = require('express')
const router = express.Router()
const User = require('./../model/user')
const {jwtAuthMiddleware, generateToken} = require('./../jwt')

// POST route to add a person
router.post('/signup',async(req,res) =>{
    try {
        const data = req.body // Assuming the request body contains the person data

          // Check if admin is already exist as there can be only 1 admin
          if (data.role === 'admin') {
            const existingAdmin = await User.findOne({ role: 'admin' });
            if (existingAdmin) {
                return res.status(400).json({ error: 'Admin already exists. Only one admin allowed.' });
            }
        }

        // Create a new user document using the Mongoose model
        const newUser = new User(data)

        // save the new user to the database
        const response = await newUser.save()
        console.log('Data Saved')

        const payload = {
            id: response.id,
        }
        console.log(JSON.stringify(payload))
        const token = generateToken(payload)
        console.log("Token is:",token)

        res.status(200).json({response: response, token: token})

    } catch (err) {
        console.log(err)
        res.status(500).json({error:'Internal Server Error'})
    }
})

// Login Route
router.post('/login', async(req,res)=>{
    try {
        // Extract aadharCardNumber and password from request body
        const {aadharCardNumber,password} = req.body

        //Find the user by aadharCardNumber
        const Person = await User.findOne({aadharCardNumber: aadharCardNumber})

        //If Person does not exist or password does not match, return error
        if(!Person || !(await Person.comparePassword(password))){
            return res.status(401).json({error:'Invalid username or password'})
        }

        // generate token
        const payload = {
            id: Person.id
        }
        const token = generateToken(payload)

        // return token as a response
        res.json({token})
        
    } catch (err) {
        console.log(err)
        res.status(500).json({error:'Internal Server Error'})
    }
})

// Profile route
router.get('/profile', async(req,res)=>{
    try {
        const userData = req.user // jwt file ke token se userid extract kr rhe hai hum

        const userId = userData.id
        const user = await User.findById(userId)

        res.status(200).json({user})

    } catch (err) {
        console.log(err)
        res.status(500).json({error:'Internal Server Error'}) 
    }
})

//user apne profile me ja kr password change kr paaye
router.put('/profile/password', jwtAuthMiddleware, async(req,res)=>{
    try {
        const userId = req.user  // Extract the id from the jwt token
        const {currentPassword,newPassword} = req.body  // Extract current and new password from request body

        // Find the user by the userID
        const user = await User.findById(userId)
         
        //If password does not match, return error
        if(!(await user.comparePassword(currentPassword))){
            return res.status(401).json({error:'Invalid username or password'})
        }

        // Update the user's password
        user.password = newPassword
        await user.save()

        console.log('Password Updated')
        await user.save()


    } catch (err) {
        console.log(err)
        res.status(500).json({error:'Internal Server Error'})
    }
})

module.exports = router;