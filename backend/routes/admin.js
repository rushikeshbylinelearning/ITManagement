// routes/admin.js

const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { protect, authorize } = require('../middleware/auth');

// Utility to convert name to email and username
function generateEmailAndUsername(name) {
    const base = name.trim().toLowerCase().replace(/\s+/g, '.');
    return {
        username: base,
        email: `${base}@company.com`
    };
}

// ✅ PROTECTED: This route is now only accessible to logged-in admins
router.post(
    '/generate-users-from-allocations',
    protect,
    authorize('admin'),
    async (req, res) => {
        try {
            console.log(`User generation initiated by admin: ${req.user.name}`);
            const allocations = await Allocation.find();
            const uniqueNames = new Set();
            const createdUsers = [];

            for (const alloc of allocations) {
                const name = alloc['Employee Name']?.trim();
                
                if (!name || uniqueNames.has(name)) continue;
                
                uniqueNames.add(name);

                const { username, email } = generateEmailAndUsername(name);
                
                const generatedPassword = crypto.randomBytes(8).toString('hex');

                const hashedPassword = await bcrypt.hash(generatedPassword, 10);

                // Find user by employeeId to prevent duplicates, or create a new one
                const userExists = await User.findOne({ email });
                if (userExists) {
                    console.log(`Skipped existing user: ${email}`);
                    continue;
                }

                await User.create({
                    name,
                    email,
                    username,
                    password: hashedPassword,
                    role: 'employee',
                    // Assuming employeeId might be in allocation, add it here if available
                    // employeeId: alloc['Employee ID'] 
                });

                createdUsers.push({ name, email, username, password: generatedPassword });

                console.log(`Created user: ${email}`);
            }

            res.status(200).json({ 
                msg: `${createdUsers.length} users created successfully from allocations.`,
                createdUsers: createdUsers 
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'An error occurred while generating users.', error: err.message });
        }
    }
);

module.exports = router;