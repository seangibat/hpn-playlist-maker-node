var express = require('express');
var router = express.Router();
var playlists = require('../playlists.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.get('/forum/:forumId/thread/:threadId', playlists.process);

module.exports = router;
