const router = require('express').Router();
const aCtrl  = require('../controllers/adminController');
const sCtrl  = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(authenticate, authorize('ADMIN'));

router.get('/stats',           aCtrl.getStats);
router.get('/users',           aCtrl.getUsers);
router.delete('/users/:id',    aCtrl.deactivateUser);
router.get('/appointments',    aCtrl.getAllAppointments);

router.post('/barbers',        aCtrl.createBarber);
router.put('/barbers/:id',     aCtrl.updateBarber);

router.post('/services',       validate(schemas.createService), sCtrl.create);
router.put('/services/:id',    validate(schemas.createService), sCtrl.update);
router.delete('/services/:id', sCtrl.remove);

module.exports = router;
