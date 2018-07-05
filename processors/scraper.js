var cheerio = require('cheerio');
var request = require('request');
var _ = require('underscore');
var envVars = require('../secrets.js');
var headers = envVars.HEADERS;

var getNumPagesAndTitle = function(id) {
  return getThreadPage(id).then(function(page) {
    var $ = cheerio.load(page);
    var numPages = $('.topic-actions .pagination span a').last().text();
    var title = $('#page-body h2 a').text().replace(/[<>\/\\]/g,"");
    numPages = numPages ? parseInt(numPages) : 1;
    return {title: title, numPages: numPages};
  });
};

var numPagesToPageNumbers = function(numPages) {
  return _.range(1, numPages + 1);
};

var getThreadPage = function(id, page) {
  return new Promise(function(resolve,
      reject) {
    page = page || 1;
    page = (page - 1) * 30;
    request({url: 'http://forums.hipinion.com/viewtopic.php?f=1&t=' + id + '&start=' + page, headers: headers}, function(error, response, body) {
      console.log(error, response, body);
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
};

var threadPageToYoutubeIds = function(page) {
  var $ = cheerio.load(page);
  var urls = $('iframe').filter(function(i, el) {
    return $(this).attr('src').includes('https://www.youtube.com/embed/');
  }).map(function(i, d) {
    console.log(d);
    var url = $(d).attr('src');
    console.log('url?');
    console.log(url);
    return url.split('https://www.youtube.com/embed/')[1];
  });
  return urls.get();
};

var getWholeThread = function(id) {
  var title;

  return getNumPagesAndTitle(id)
    .then(function(thread){
      title = thread.title;
      console.log(title);
      return thread.numPages;
    })
    .then(numPagesToPageNumbers)
    .then(function(pageNumbers) {
      console.log(pageNumbers);
      return pageNumbers.map(getThreadPage.bind(null, id))
    })
    .then(function(requests) {
      return Promise.all(requests);
    })
    .then(function(pagesArray) {
      return pagesArray.map(threadPageToYoutubeIds)
    })
    .then(function(youtubeIds){
      console.log(youtubeIds);
      return {
        youtubeIds: _.unique(_.flatten(youtubeIds)),
        id: id,
        title: title
      };
    });
};

module.exports = getWholeThread;
