var request = require('request');
var google = require('googleapis');
var Promise = require('bluebird');
var envVars = require('./secrets.js');
var scraper = require('./scraper');
var OAuth2 = google.auth.OAuth2;

var oauth2Client = new OAuth2(envVars.CLIENT_ID, envVars.CLIENT_SECRET, envVars.REDIRECT_URL);
google.options({ auth: oauth2Client });

var youtube = google.youtube('v3');

Promise.promisifyAll(youtube.playlists);
Promise.promisifyAll(youtube.playlistItems);

var getNewAuthToken = function(){
  var options = {
    uri: "https://accounts.google.com/o/oauth2/token",
    form: { 
      grant_type:'refresh_token', 
      client_id: envVars.CLIENT_ID, 
      client_secret: envVars.CLIENT_SECRET, 
      refresh_token: envVars.REFRESH_TOKEN
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };
  
  return new Promise(function(resolve, reject){
    request.post(options, function(err, response, body){
      if (err) reject(err);
      envVars.ACCESS_TOKEN = JSON.parse(body).access_token;
      oauth2Client.setCredentials({
        access_token: envVars.ACCESS_TOKEN,
        refresh_token: envVars.REFRESH_TOKEN
      });
      resolve();
    }); 
  });
};

// cb is first because the other two params are optional
var listPlaylists = function(prevPage){ 
  var options = {
    maxResults: 50,
    mine: true,
    part: "snippet",
    pageToken: prevPage ? prevPage.nextPageToken : ""
  };

  return youtube.playlists.listAsync(options)
    .then(function(data){
      data = data[0];
      data.items = prevPage ? prevPage.items.concat(data.items) : data.items;
      if (data.nextPageToken) { return listPlaylists(data); }
      else { return data.items; }
    });
};

var createPlaylist = function(thread){
  var options = {
    part: "snippet,status",
    resource: {
      snippet: { 
        title: thread.title.replace(/[^a-z0-9\s]/gmi, ""), 
        description: thread.description 
      }, 
      status: {
        privacyStatus: 'public'
      } 
    }
  };
  return youtube.playlists.insertAsync(options)
    .then(function(response){
      thread.playlistId = response[1].body.id;
      return thread;
    });
};

var addToPlaylist = function(youtube){
  var params = {
    part: 'snippet',
    resource: { 
      'snippet': { 
        'playlistId': youtube.playlistId, 
        'resourceId': { 
          'kind':'youtube#video', 
          'videoId': youtube.videoId
        } 
      } 
    }
  };

  return youtube.playlistItems.insertAsync(params);
};

var findOrCreatePlaylist = function(thread){
  return listPlaylists()
    .then(function(playlists){
      playlists.some(function(playlist){
        if (playlist.snippet.description === thread.description) {
          thread.playlistId = playlist.id;
          return true;
        }
        return false;
      });

      if (!thread.playlistId) return createPlaylist(thread);
      else return thread;
    });
};

var addAllToPlaylist = function(thread){
  return Promise.all(thread.youtubeIds.map(function(youtubeId){
    return addToPlaylist({
      videoId: youtubeId,
      playlistId: playlistId
    });
  }));
};

getNewAuthToken()
.then(listPlaylists)
.then(findOrCreatePlaylist)
.then(addAllToPlaylist);

// exports.process = playlist;