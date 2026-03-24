// ─── routes/slots.js ─────────────────────────────────────────
const express = require('express');
const slotRouter = express.Router();
const slotCtrl = require('../controllers/slotController');
slotRouter.get('/', slotCtrl.getSlots);
module.exports = slotRouter;
