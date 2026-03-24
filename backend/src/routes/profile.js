const router = require('express').Router();
const ctrl   = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/',           ctrl.getProfile);
router.patch('/',         ctrl.updateProfile);
router.patch('/password', ctrl.changePassword);

module.exports = router;
