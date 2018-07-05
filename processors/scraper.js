var cheerio = require('cheerio');
var request = require('request');
var _ = require('underscore');
var envVars = require('../secrets.js');

request = request.defaults({jar: true});

var loginToBoard = function() {
  var headers = {
      'Connection': 'keep-alive',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'Origin': 'http://forums.hipinion.com',
      'Upgrade-Insecure-Requests': '1',
      'DNT': '1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Referer': 'http://forums.hipinion.com/ucp.php?mode=login&sid=c5c9c39de2af2803fa03e2095dac9767',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': '__utma=24852781.680835860.1530810279.1530810279.1530810279.1; __utmc=24852781; __utmz=24852781.1530810279.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); style_cookie=null; __utmt=1; phpbb3_5ouhf_u=1; phpbb3_5ouhf_k=; phpbb3_5ouhf_sid=c5c9c39de2af2803fa03e2095dac9767; __utmb=24852781.13.10.1530810279'
  };
  
  var dataString = envVars.DATA_STRING;
  
  var options = {
      url: 'http://forums.hipinion.com/ucp.php?mode=login',
      method: 'POST',
      headers: headers,
      body: dataString
  };
  
  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      if (!error) {
        console.log('i think we logged in..');
        resolve();
      } else {
        console.log('error logging in');
        reject(error);
      }
      console.log('done trying to login');
    });
  });
};

var getNumPagesAndTitle = function(id) {
  return loginToBoard()
    .then(function() {
      return getThreadPage(id);
    })
    .then(function(page) {
      console.log('meow?!?!?!?!?!?!?!')
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
  console.log('hey the thread page');
  return new Promise(function(resolve,
      reject) {
    page = page || 1;
    page = (page - 1) * 30;
    request({url: 'http://forums.hipinion.com/viewtopic.php?f=1&t=' + id + '&start=' + page}, function(error, response, body) {
      // console.log(error, response, body);
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
    var url = $(d).attr('src');
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
