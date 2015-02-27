var request = require('request');
var cheerio = require('cheerio');
var google = require('googleapis');
var youtube = google.youtube('v3');
var storage = require('node-persist');
var envVars = require('secrets.js'); // options
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(envVars.CLIENT_ID, envVars.CLIENT_SECRET, envVars.REDIRECT_URL);
google.options({ auth: oauth2Client });


var getNewAuthToken = function(cb){
  url = 'https://accounts.google.com/o/oauth2/token';
  payload = { 
    grant_type:'refresh_token', 
    client_id: envVars.CLIENT_ID, 
    client_secret: envVars.CLIENT_SECRET, 
    refresh_token: envVars.REFRESH_TOKEN
  };
  headers = {"Content-Type": "application/x-www-form-urlencoded"};
  
  request.post({
    uri: url,
    form: payload,
    headers: headers
  }, function(error, response, body){
    envVars.ACCESS_TOKEN = JSON.parse(body).access_token;
    oauth2Client.setCredentials({
      access_token: envVars.ACCESS_TOKEN,
      refresh_token: envVars.REFRESH_TOKEN
    });
    cb();
  });
};

// cb is first because the other two params are optional
var listPlaylists = function(cb, arr, nextPageToken){ 
  youtube.playlists.list({
    maxResults: 50,
    mine: true,
    part: "snippet",
    pageToken: nextPageToken || ""
  }, function(err, data){
    arr = (arr) ? arr.concat(data.items) : data.items;
    if (data.nextPageToken){
      listPlaylists(cb, arr, data.nextPageToken);
    }
    else {
      cb(arr);
    }
  });
};

var createPlaylist = function(title, description, cb){
  youtube.playlists.insert({
    part: "snippet,status",
    resource: {
      snippet: { 
        title: title.replace(/[^a-z0-9\s]/gmi, ""), 
        description: description 
      }, 
      status: {
        privacyStatus: 'public'
      } 
    }
  }, cb);
};

var addToPlaylist = function(playlistId, youtubeId, cb){
  youtube.playlistItems.insert({
    part: 'snippet',
    resource: { 
      'snippet': { 
        'playlistId': playlistId, 
        'resourceId': { 
          'kind':'youtube#video', 'videoId':youtubeId 
        } 
      } 
    }
  }, cb);
};

var playlist = function(req, res){
  // var threadId = req.params.threadId,
  //     forumId  = req.params.forumId, $;

  var threadId = "55097";
  var forumId = "1";

  createPlaylist("TESTGIN FUCK", "wfwf", function(err, data){
    console.log(err, data);
    addToPlaylist(data.id, "y_2VAEeeMVo", function(err, data){
      console.log(err, data);
    });
  });
};


newAuthToken(function(){
  playlist();
});

exports.process = playlist;


// var initialPageProcess = function(error, response, body){
//   if (!error && response.statusCode == 200) {
//     var $ = cheerio.load(body);

//     title = $('#page-header h2').text();

//     console.log(title);
//   }
// }

// var pageProcess = function(error, response, body){
//   if (!error && response.statusCode == 200) {
//     var $ = cheerio.load(body);

//     title = $('#page-header h2').text();

//   }
// }