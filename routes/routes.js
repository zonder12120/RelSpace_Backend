const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');

router.post('/selectedWeek', async (req, res) => {
        if (!req.body) {
            return res.status(400).send('Bad Request');
        }

        await controller.home(req, res);
});

module.exports = router;