const express = require('express');
const router = express.Router();
const gearboxController = require('../controllers/gearboxController')

router.get("/gearbox", gearboxController.getGearboxes)
// Place the more specific route before the parameterized :id route
router.get("/gearbox/:id/materials", gearboxController.getAllGearboxDataById)
router.get("/gearbox/:id", gearboxController.getGearboxById)

router.post("/gearbox", gearboxController.createGearbox)

router.delete("/gearbox/:id", gearboxController.deleteGearboxById)
module.exports = router;