var fs = require('fs')
	, request = require('request')
	, xml2js = require('xml2js')
	, async = require('async')
	, db = require('./database.js')
	;

var limit = 5;
var rssJSON = './rsslinks.json';
var rssSites = JSON.parse(fs.readFileSync(rssJSON));
var parser = new xml2js.Parser();

db.sql.sync().done(function(){

	async.eachSeries(rssSites, function(site, done) {
		db.Site.findOrCreate({
			name : site.name,
			lastUpdate : new Date(site.last_update)
	  	}).success(function(newSite, created){

	  		if (created == true) {
	  			async.eachSeries(site.rss, function(rssCat, doneRSS) {	
	  				db.Category.findOrCreate({
	  						title : rssCat.category,
	  						link : rssCat.link
						}).success(function(catgry) {
							newSite.addCategory(catgry);
							doneRSS();
						});

	  			}, function(err) {
					if (err)
						console.log(err);
					// finally save the site
					newSite.save();
				});
	  		}
	  		// run each site in parallel
	  		done();
		});        
	}, function(err) {
		if (err)
			console.log(err);	
	});
	

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
												// console.log(item.title[0], item.pubDate);

												// if (item.pubDate == undefined)
												// 	console.error("pubDate undefined", rss.link);
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

