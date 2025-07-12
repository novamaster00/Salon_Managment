const express = require('express');
const router = express.Router();
const getAllBarbers= require('../utils/BarberList');

router.post('/',getAllBarbers);

module.exports=router;