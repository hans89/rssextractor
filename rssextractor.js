var fs = require('fs')
	, request = require('request')
	, xml2js = require('xml2js')
	, async = require('async')
	, db = require('./database.js')
	;

var limit = 5;
var requestTimeout = 1*1000;
var hourInterval = 2;
var interval = 1000;
var rssJSON = './rsslinks.json';
var rssSites = JSON.parse(fs.readFileSync(rssJSON));
var parser = new xml2js.Parser();

db.sql.sync().done(function(){
	db.init(rssSites, function(){
		async.forever(
			function(next) {

				var parseDone = function (err) { 
					//db.logStream.end();
					console.log("====DONE====", new Date(), "Next run in", hourInterval, "hour(s).");
					if (err) {
						console.log("ERROR3", err);
					}
					setTimeout(next, interval);
				}

				var time = new Date();

				console.log("====RUN====", time);

				db.Category
					.findAll()
					.success(function(categories) {
						async.eachLimit(categories, limit, function(rssCat, doneRSS){
							var update = false;
							request({
									url: rssCat.link,
									timeout: requestTimeout
								}
								, function (error, response, body) {
								if (!error && response.statusCode == 200 && body) {
									parser.parseString(body, function (err, result) {
										if (!err && result && result.rss) {
											async.each(result.rss.channel, function(channel, doneChannel){
												async.eachLimit(channel.item, limit, function(item, doneItem) {	
									  				db.News.findOrCreate({
								  						title : item.title[0],
								  						link : item.link ? item.link[0] : null
														}, {
															title : item.title[0],
															link : item.link ? item.link[0] : null,
															pubDate : item.pubDate ? new Date(item.pubDate[0]) : null,
															guid : item.guid ? item.guid[0] : null
														}).success(function(news, created) {
															if (created) {
																rssCat.addNew(news);
																update = true;
															}
															doneItem();
														}).error(doneItem);
									  			}, doneChannel);
											}, function(err) {
												// finally save the foreign keys
												if (update) {
													rssCat.save().done(doneRSS);
												} else {
													doneRSS();
												}
											});
										} else {
											if (error) {
												console.log("ERROR1", error);
											}
											doneRSS();
										}
									});
								} else {
									if (error) {
										console.log("ERROR2", error);
									}
									doneRSS();
								}
							});	
					}, parseDone);
				}).error(parseDone);
			},
			function (err) {
				console.log("====FOREVER_ERROR====", err);
			}
		);
	});
});

