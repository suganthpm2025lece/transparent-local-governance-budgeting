const express = require('express');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/summary', reportController.getReportsSummary);
router.get('/export', reportController.exportCsvReport);

module.exports = router;
