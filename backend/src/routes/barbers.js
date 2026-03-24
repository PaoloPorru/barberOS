const router = require('express').Router();
const ctrl   = require('../controllers/barberController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.get('/:id/availability',  ctrl.getAvailability);
router.get('/:id/blocked-slots', authenticate, authorize('BARBER','ADMIN'), ctrl.getBlockedSlots);

router.put('/:id/availability',
  authenticate, authorize('BARBER','ADMIN'),
  validate(schemas.setAvailability),
  ctrl.setAvailability
);

router.post('/:id/blocked-slots',
  authenticate, authorize('BARBER','ADMIN'),
  validate(schemas.blockSlot),
  ctrl.blockSlot
);

router.delete('/:id/blocked-slots/:slotId',
  authenticate, authorize('BARBER','ADMIN'),
  ctrl.unblockSlot
);

module.exports = router;
