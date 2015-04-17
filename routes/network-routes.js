var auth = require('../modules/auth-handler');
var network = require('../modules/network-handler');

exports.getCredentials = function (request, response, next){
	var userId = request.get('Authorization');
	auth.isAuthorized(userId, function (authorized){
		if(authorized){
			network.getCredentials(userId, function (credentials){
				if(credentials.err !== undefined){
					response.status(400);
				}
				response.jsonp(credentials);
			})
		}
		else{
			response.status(401);
			response.jsonp({'err':'User not authorized.'});
		}
	});
};