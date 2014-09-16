var rssJSON = './rsslinks.json';

var fs = require('fs');
var rssSites = JSON.parse(fs.readFileSync(rssJSON));
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var async = require('async');
var Sequelize = require('sequelize');

var db = new Sequelize(null, null, null, {
		dialect : 'sqlite',
		storage : './db.sqlite'
});

var limit = 5;

var News = db.define('news', {
	title : Sequelize.TEXT,
	link : Sequelize.TEXT,
	guid : Sequelize.STRING,
	pubDate : Sequelize.DATE
});

var Categories = db.define('categories', {
	title : Sequelize.STRING
});

var Sites = db.define('sites', {
	name : Sequelize.STRING,
	lastUpdate : Sequelize.DATE
});

Sites.hasMany(Categories, {as : 'cats'});
Categories.hasMany(News, {as : 'news'});

db.sync().done(function(){
	var outStream = fs.createWriteStream('test.rss');
	async.eachSeries(rssSites, function(site, doneSite) {
		async.eachLimit(site.rss, limit, function(rss, doneRSS) {
			request(rss.link, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					parser.parseString(body, function (err, result) {
						if (!err) {
							if (result) {
								if (result.rss) {
									var channels = result.rss.channel;
									if (channels) {
										for (var k = 0; k < channels.length; k++) {
											var items = channels[k].item;

											//console.log(items);

											for (var h = 0; h < items.length; h++) {
												var item = items[h];
												console.log(item.title[0], item.pubDate);

												if (item.pubDate == undefined)
													console.error("pubDate undefined", rss.link);
											}
										}
									}
								}
							} else {
								console.error("null result" , rss.link, body);
							}
							doneRSS();
						} else {
							doneRSS(err);
						}
				    });
				} else {
					doneRSS(error);
				}
			});
		}, doneSite);
	}, function(err) {
		if (err)
			console.log(err);	
	});
});

