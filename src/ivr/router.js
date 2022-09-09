const Router = require('express').Router;
const {
  welcome,
  menu,
  saveVoiceMail,
  getVoicemailDetails,
} = require('./handler');

const router = new Router();

// POST: /ivr/welcome
router.post('/welcome', (req, res) => {
  res.send(welcome());
});

// POST: /ivr/menu
router.post('/menu', (req, res) => {
  const digit = req.body.Digits;
  return res.send(menu(digit));
});

// GET: /ivr/voicemail/save
router.get('/voicemail/save', (req, res) => {
  res.send(saveVoiceMail(req));
});

// GET: /ivr/voicemail/details
router.get('/voicemail/detail', (req, res) => {
  getVoicemailDetails(res);
});

module.exports = router;
