const express = require('express');
const router = express.Router();

router.use('/users', require('./api/users'));
router.use('/auth', require('./api/auth'));
router.use('/posts', require('./api/posts'));
router.use('/profile', require('./api/profile'));

module.exports = router;
