var fs = require('fs')
	, request = require('request')
	, xml2js = require('xml2js')
	, async = require('async')
	, db = require('./database.js')
	;

var limit = 5;
var hourInterval = 2;
var interval = hourInterval*3600*1000;
var rssJSON = './rsslinks.json';
var rssSites = JSON.parse(fs.readFileSync(rssJSON));
var parser = new xml2js.Parser();

db.sql.sync().done(function(){
	async.forever(
		function(next) {
			var time = new Date();

			console.log("====RUN====", time);

			//db.logStream = fs.createWriteStream('test/' + time.toString() + '.log');
			async.series([
				function(done) {
					db.init(rssSites, done);		
				},
				function(done) {
					db.Category
						.findAll()
						.success(function(categories) {
							async.eachLimit(categories, limit, function(rssCat, doneRSS){
								var update = false;
								request(rssCat.link, function (error, response, body) {
									if (!error && response.statusCode == 200 && body) {
										parser.parseString(body, function (err, result) {
											if (!err && result && result.rss) {
												async.each(result.rss.channel, function(channel, doneChannel){
													async.each(channel.item, function(item, doneItem) {	
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
												doneRSS(error);
											}
										});
									} else {
										doneRSS(error);
									}
								});	
						}, done);
					}).error(done);
				}
			], function (err, results) { 
				//db.logStream.end();
				console.log("====DONE====", new Date(), "Next run in", hourInterval, "hour(s).");
				setTimeout(next, interval);
			});
		},
		function (err) {
			console.log("====FOREVER_ERROR====", err);
		}
	);
});

