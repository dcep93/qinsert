var express = require('express');
var path = require('path');

var query = require('./query');

var router = express.Router();

var index = path.join(__dirname, 'views', 'index.ejs');
var views = path.join(path.dirname(require.main.filename), 'views');

router.get('/', function(req, res) {
	res.render(index, {
		title: 'QOrder',
		views: views,
	});
});

router.use('/query', query);

router.use(express.static(path.join(__dirname, 'public')));

module.exports = router;
