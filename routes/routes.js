const express = require('express');
const router = express.Router();
const releaseService = require('../services/releaseService');

router.post('/getReleasesForSelectedWeek', releaseService.getReleasesForSelectedWeek);
router.post('/addRelease', releaseService.addRelease);
router.post('/deleteRelease', releaseService.deleteRelease);

module.exports = router;