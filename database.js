var Sequelize = require('sequelize');

var db = new Sequelize(null, null, null, {
		dialect : 'sqlite',
		storage : './db.sqlite'
});

var limit = 5;

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
Category.belongsTo(Site);
Category.hasMany(News);

var database = {
	"sql" : db,
	"News" : News,
	"Category" : Category,
	"Site" : Site
};

module.exports = database;