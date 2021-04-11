const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const config = require('config');
const request = require('request');

const auth = require('../../middlewares/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({
                msg: 'There is no profile for this user'
            });
        }

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty(),
            check('skills', 'Skills should be an array of strings').isArray({
                min: 1,
                max: 10
            })
        ]
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {} = req.body;

            // Build profile schema
            const profileFields = { ...req.body };
            profileFields.user = req.user.id;

            let profile = await Profile.findOne({ user: req.user.id });

            // Update if profile exists
            if (profile) {
                console.log(profileFields);
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    {
                        $set: profileFields
                    },
                    { new: true }
                );
                return res.json(profile);
            }

            // Create a profile if not found

            profile = new Profile(profileFields);

            await profile.save();

            res.json(profile);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find({}).populate('user', [
            'name',
            'avatar'
        ]);

        res.json(profiles);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found.' });
        }

        res.json(profile);
    } catch (error) {
        console.log(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        // @todo - Remove user's posts

        await Profile.findOneAndRemove({ user: req.user.id });

        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User deleted' });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
    '/experience',
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(error.array());
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            if (!profile) {
                return res.status(400).json({ msg: 'Profile not found.' });
            }

            profile.experience.unshift(req.body);

            await profile.save();

            res.json(profile);
        } catch (error) {
            console.log(error);
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experice from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get remove index
        const removeIndex = profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('fieldofstudy', 'Field of study is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(error.array());
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            if (!profile) {
                return res.status(400).json({ msg: 'Profile not found.' });
            }

            profile.education.unshift(req.body);

            await profile.save();

            res.json(profile);
        } catch (error) {
            console.log(error);
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get remove index
        const removeIndex = profile.education
            .map((item) => item.id)
            .indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_page=5&sort=created:asc&client_id=${config.get(
                'githubClientId'
            )}&client_secret=${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };

        request(options, (error, response, body) => {
            if (error) {
                console.error(error);
            }

            if (response.statusCode !== 200) {
                return res
                    .status(401)
                    .json({ msg: 'Not github profile found' });
            }

            return res.json(JSON.parse(body));
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
