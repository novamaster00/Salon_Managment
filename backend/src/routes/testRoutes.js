const express = require('express');
const {
    testTokenDecoder,
  registerWithBetterTokens,
  manualVerifyUser
} = require('../utils/test');

const router = express.Router();

router.post('/test-email',manualVerifyUser);
router.post('/token-decode',testTokenDecoder);
router.post('/new-register',registerWithBetterTokens);

module.exports=router; 