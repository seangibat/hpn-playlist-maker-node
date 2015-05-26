var cheerio = require('cheerio');
var request  = require('request');

var getNumPages = function(id){
  return getThreadPage(id).then(function(page){
    var $ = cheerio.load(page);
    var numPages = $('.topic-actions .pagination span a').last().text();
    numPages = numPages ? parseInt(numPages) : 1;
    return numPages;
  });
};

var numPagesToRange = function(numPages){
  var arr = [];
  for (var i = 1; i <= numPages; i++){
    arr.push(i);
  }
  return arr;
};

var getThreadPage = function(id, page){
  return new Promise(function(resolve, reject){
    page = page || 1;
    page = (page - 1) * 30;
    request('http://forums.hipinion.com/viewtopic.php?f=1&t=' + id + '&start=' + page, function(error, response, body){
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
};

var threadPageToYoutubeIds = function(page){
  var $ = cheerio.load(page);
  var urls = $('embed').map(function(i, d){ 
    var url = $(d).attr('src');
    return url.split('youtube.com/v/')[1].substring(0,11)
  });
  return urls.get();
};

var getWholeThread = function(id, numPages){
  getNumPages(id)
  .then(numPagesToRange)
  .then(function(range){
    return Promise.all(range.map(getThreadPage.bind(null, id)));
  })
  .then(function(pagesArray){
    return pagesArray.map(threadPageToYoutubeIds)
  })
  .then(function(idsArrays){
    return idsArrays.reduce(function(memo, current){
      return memo.concat(current); 
    });
  })
  .then(console.log);
};

var processThread = function(id){

};

// getThreadPage(84672).then(threadPageToYoutubeIds).then(function(d){ console.log(d) });

getWholeThread(84672);