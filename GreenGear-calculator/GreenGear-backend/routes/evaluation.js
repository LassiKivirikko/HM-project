const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

// Create an evaluation (POST)
router.post('/evaluation', evaluationController.createEvaluation);
// List all evaluations (GET)
router.get('/evaluation', evaluationController.getEvaluations);
// Get evaluations by gearbox id
router.get('/evaluation/gearbox/:gearbox_id', evaluationController.getEvaluationsByGearboxId);
// Full structured evaluation payload (must precede generic :id route)
router.get('/evaluation/:id/full', evaluationController.getEvaluationFull);
// Get a single evaluation by id (basic row)
router.get('/evaluation/:id', evaluationController.getEvaluationById);
// Delete evaluation by id (and cascade cleanup if gearbox orphaned)
router.delete('/evaluation/:id', evaluationController.deleteEvaluation);
// Update evaluation payload_json and optional result totals (PATCH)
router.patch('/evaluation/:id', evaluationController.updateEvaluation);

module.exports = router;