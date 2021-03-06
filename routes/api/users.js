const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Please enter a password with 6 or more characters'
        ).isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ errors: errors.array() });
        }

        const {
            body: { name, email, password }
        } = req;

        try {
            // See if user exists

            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({
                    errors: [{ msg: 'User already exists' }]
                });
            }

            // Get users gravatar

            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            const salt = await bcrypt.genSalt(10);

            // Encrypt the password using bcrypt

            user = { name, email, password, avatar };
            user.password = await bcrypt.hash(password, salt);

            user = new User(user);
            // Return jsonwebtoken

            await user.save();

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: config.get('tokenValidity') },
                (err, token) => {
                    if (err) throw err;
                    return res.json({ token });
                }
            );
        } catch (error) {
            console.log(error);
            return res.status(500).send('Server error');
        }
    }
);

module.exports = router;
