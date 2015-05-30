var express = require('express');
var router = express.Router();
var scraper = require('../processors/scraper.js');
var youtube = require('../processors/youtube.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.get('/forum/:forumId/thread/:threadId', function(req, res){
  var thread;

  scraper(req.params.threadId)
  .then(function(threadObj){
    if (!threadObj.youtubeIds.length){
      throw new Error('There are no youtube videos in this thread you dolt!');
    } else {
      thread = threadObj;
      return findPlaylist(thread.id);
    }
  })
  .then(function(playlistId){
    if (!playlistId){
      return createPlaylist(thread.title, thread.id);
        .then(function(playlistId){
          res.end("Playlist now being created -- " + playlistId);
          return playlistId;
        });
    } else {
      res.end("Playlist now being updated -- " + playlistId);
      return youtube.filterOutOldVideos(playlistId, thread.youtubeIds)
        .then(function(){ return playlistId });
    }
  })
  .then(function(playlistId){
    return youtube.addAllToPlaylist(thread.youtubeIds, playlistId);
  })
  .then(function(){
    console.log("OK!");
  })
  .catch(function(error){
    res.end(error.message);
  });
});

module.exports = router;
