var cheerio = require('cheerio');
var request  = require('request');
var _ = require('underscore');

var getNumPages = function(id){
  return getThreadPage(id).then(function(page){
    var $ = cheerio.load(page);
    var numPages = $('.topic-actions .pagination span a').last().text();
    numPages = numPages ? parseInt(numPages) : 1;
    return numPages;
  });
};

var numPagesToPageNumbers = function(numPages){
  return _.range(1, numPages + 1);
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
  return getNumPages(id)
    .then(numPagesToPageNumbers)
    .then(function(pageNumbers){
      return pageNumbers.map(getThreadPage.bind(null, id))
    })
    .then(function(requests){
      return Promise.all(requests);
    })
    .then(function(pagesArray){
      return pagesArray.map(threadPageToYoutubeIds)
    })
    .then(_.flatten);
};

module.exports = getWholeThread;