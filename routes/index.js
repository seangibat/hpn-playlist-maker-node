var express = require('express');
var router = express.Router();
var scraper = require('../processors/scraper.js');
var youtube = require('../processors/youtube.js');
var _ = require('underscore');

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
      return youtube.findPlaylist(thread.id);
    }
  })
  .then(function(playlistId){
    console.log('playlist', playlistId);
    if (!playlistId){
      return youtube.createPlaylist(thread.title, thread.id)
        .then(function(playlistId){
          res.end("Playlist now being created. Might take a minute to finish.<br><a target='_blank' href='https://www.youtube.com/playlist?list=" + playlistId + "'>" + thread.title + "</a>");
          return playlistId;
        });
    } else {
      res.end("Playlist now being updated. Might take a minute to finish.<br><a target='_blank' href='https://www.youtube.com/playlist?list=" + playlistId + "'>" + thread.title + "</a>");
      return youtube.filterOutOldVideos(playlistId, thread.youtubeIds)
        .then(function(youtubeIds){ 
          thread.youtubeIds = youtubeIds;
          return playlistId 
        });
    }
  })
  .then(function(playlistId){
    return youtube.addAllToPlaylist(thread.youtubeIds, playlistId);
  })
  .then(function(){
    console.log("OK!");
  })
  .catch(function(error){
    console.error(error);
    res.end(error.message);
  });
});

module.exports = router;
