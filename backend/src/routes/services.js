const router = require('express').Router();
const ctrl   = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);

module.exports = router;
