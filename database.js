var Sequelize = require('sequelize')
	, async = require('async')
	;

var logger = function(content) {
	if (database.logStream){
		database.logStream.write(content);
		database.logStream.write('\n');	
	} else {
		console.log(content);
	}
};

var db = new Sequelize(null, null, null, {
		dialect : 'sqlite',
		storage : './db.sqlite',
		logging : logger
});

var News = db.define('News', {
	title : Sequelize.TEXT,
	link : Sequelize.TEXT,
	guid : Sequelize.STRING,
	pubDate : Sequelize.DATE
});

var Category = db.define('Category', {
	title : Sequelize.STRING,
	link : Sequelize.TEXT
});

var Site = db.define('Site', {
	name : Sequelize.STRING,
	lastUpdate : Sequelize.DATE
});

Site.hasMany(Category);
Category.hasMany(News);

var database = {
	sql : db,
	News : News,
	Category : Category,
	Site : Site,
	init : function(rssSites, doneInit) {
		// init db data
		async.eachSeries(rssSites, function(site, done) {
			Site.findOrCreate({
				name : site.name,
				lastUpdate : new Date(site.last_update)
		  	}).success(function(newSite, created) {

		  		if (created == true) {
		  			async.eachSeries(site.rss, function(rssCat, doneRSS) {	
		  				Category.findOrCreate({
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
		}, doneInit);
	}
};

module.exports = database;