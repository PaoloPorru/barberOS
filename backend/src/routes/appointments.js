const router = require('express').Router();
const ctrl   = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(authenticate);

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   authorize('CLIENT','ADMIN'), validate(schemas.createAppointment), ctrl.create);
router.patch('/:id',        authorize('CLIENT','ADMIN'), validate(schemas.updateAppointment), ctrl.update);
router.delete('/:id',       authorize('CLIENT','ADMIN'), ctrl.remove);
router.patch('/:id/status', authorize('BARBER','ADMIN'), validate(schemas.updateStatus), ctrl.updateStatus);

module.exports = router;
