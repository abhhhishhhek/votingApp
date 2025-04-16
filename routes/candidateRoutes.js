const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Candidate = require('../model/candidate');
const { jwtAuthMiddleware } = require('../jwt');

const checkAdminRole = async (userID) => {
   try {
        const user = await User.findById(userID);
        return user.role === 'admin';
   } catch {
        return false;
   }
};

//  PUBLIC ROUTES 

// Get all candidates (name + party)
router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find({}, 'name party -_id');
        res.status(200).json(candidates);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get vote count
router.get('/vote/count', async (req, res) => {
    try {
        const candidates = await Candidate.find().sort({ voteCount: -1 });
        const voteRecord = candidates.map((c) => ({
            party: c.party,
            count: c.voteCount
        }));
        res.status(200).json(voteRecord);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//  SECURED ROUTES

// Add new candidate (admin only)
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id)))
            return res.status(403).json({ message: 'User is not admin' });

        const newCandidate = new Candidate(req.body);
        const response = await newCandidate.save();
        res.status(200).json({ response });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update candidate
router.put('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id)))
            return res.status(403).json({ message: 'User is not admin' });

        const candidateID = req.params.candidateID;
        const response = await Candidate.findByIdAndUpdate(candidateID, req.body, {
            new: true,
            runValidators: true
        });

        if (!response) return res.status(404).json({ error: 'Candidate not found' });

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete candidate
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id)))
            return res.status(403).json({ message: 'User is not admin' });

        const response = await Candidate.findByIdAndDelete(req.params.candidateID);
        if (!response) return res.status(404).json({ error: 'Candidate not found' });

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Vote (non-admins only, only once)
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    const candidateID = req.params.candidateID;
    const userId = req.user.id;

    try {
        const candidate = await Candidate.findById(candidateID);
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Admin cannot vote' });
        if (user.isVoted) return res.status(400).json({ message: 'You have already voted' });

        candidate.votes.push({ user: userId });
        candidate.voteCount++;
        await candidate.save();

        user.isVoted = true;
        await user.save();

        res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get the list of all candidates
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
