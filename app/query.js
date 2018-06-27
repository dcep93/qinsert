var express = require('express');
var request = require('request');

var router = express.Router();

var apiUrl = 'https://quizlet.com/webapi/3.1/';
var termsUrl = apiUrl + 'terms?filters[isDeleted]=0&filters[setId]=';
var setUrl = apiUrl + 'sets/';
var searchUrl = setUrl + 'search?filters[isDeleted]=0&perPage=9&query=';
router.get('/', function(req, res) {
	var setId = req.query.id;
	if (!(Number(setId) > 0)) {
		var query = setId;
		get(searchUrl + query, function(response) {
			setId = response.models.set[0].id;
			getSet(setId, res);
		});
	} else {
		getSet(setId, res);
	}
});

function get(url, callback) {
	request({ uri: url, method: 'GET' }, function(error, resp, body) {
		if (error || resp.statusCode !== 200) {
			console.log(query);
			console.error('error', error);
			console.error(JSON.stringify(JSON.parse(body), null, 2));
		} else {
			var response = JSON.parse(body).responses[0];
			callback(response);
		}
	});
}

function getSet(setId, res) {
	var title;
	var terms;
	function sendSet() {
		res.send({ title: title, terms: terms, id: setId });
	}
	get(termsUrl + setId, function(response) {
		var rawTerms = response.models.term;
		terms = rawTerms
			.map(function(term) {
				return {
					word: term.word,
					definition: term.definition,
					index: term.rank,
					image: term._imageUrl,
				};
			})
			.sort(function(t1, t2) {
				return t1.index - t2.index;
			});
		if (title !== undefined) {
			sendSet();
		}
	});
	get(setUrl + setId, function(response) {
		title = response.models.set[0].title;
		if (terms !== undefined) {
			sendSet();
		}
	});
}

module.exports = router;
