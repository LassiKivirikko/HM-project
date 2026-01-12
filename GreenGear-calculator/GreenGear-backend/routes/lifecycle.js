const express = require('express');
const router = express.Router();
const lifecycleController = require('../controllers/lifecycleController');
const electricityCostsController = require('../controllers/electricityCostController');
const socialDataController = require('../controllers/socialDataController');

router.post("/lifecycle/manufacturing_data", lifecycleController.createManufacturingDataByGearboxId);
router.post("/lifecycle/use_phase_data", lifecycleController.createUsePhaseDataByGearboxId);
router.post("/lifecycle/maintenance_data", lifecycleController.createMaintenanceDataByGearboxId);
router.post("/lifecycle/transportation_data", lifecycleController.createTransportDataByGearboxId);
router.post("/lifecycle/end_of_life_data", lifecycleController.createEndOfLifeDataByGearboxId);

router.get("/lifecycle/gearbox/:id", lifecycleController.getLifecycleDataByGearboxId);


router.get("/electricity_costs", electricityCostsController.getElectricityCosts);
router.post("/electricity_costs", electricityCostsController.createElectricityCost);

router.get("/social_data", socialDataController.getSocialData);
module.exports = router;