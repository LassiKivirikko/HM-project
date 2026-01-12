const express = require('express');
const router = express.Router();
const materialsController = require("../controllers/materialsController")
const envinronmentDataController = require("../controllers/environmentDataController")
const authMiddleware = require("../middleware/authMiddleware").authMiddleware;


router.get('/materials', materialsController.getMaterials);
router.get('/materials/:id', materialsController.getMaterialsById);
router.get('/materials/gearbox/:id', materialsController.getMaterialsByGearboxId);

router.post('/materials', materialsController.createMaterial);
router.post('/materials/gearbox_material', materialsController.createGearboxMaterialByGearboxId);

router.put('/materials/:id', materialsController.updateMaterialById);

router.delete('/materials/:id', materialsController.deleteMaterialById)
router.delete('/environment_data/:id', envinronmentDataController.deleteEnvironmentDataById)
router.get('/environment_data', envinronmentDataController.getEnvironmentData);
router.get('/environment_data/material/:id', envinronmentDataController.getEnvironmentDataByMaterialId);
router.post('/environment_data', envinronmentDataController.createEnvironmentDataWithMaterialId);

router.put('/environment_data/:id', envinronmentDataController.updateEnvironmentData);

module.exports = router;