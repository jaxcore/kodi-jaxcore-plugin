var Spin = require('jaxcore-spin');
var KodiAdapter = require('./adapter');
var Kodi = require('./client');

Spin.debug(true);

var kodi = new Kodi({
	host: process.env.KODI_HOST || 'localhost',
	port: 9090
});



// Spin.connectOne(function(spin) {
// 	kodiAdapter.addSpin(spin);
// });

Spin.connectAll(function(spin) {
	
	var kodiAdapter = new KodiAdapter();
	kodiAdapter.addDevice(kodi);
	kodiAdapter.addSpin(spin);
	
	
});

// 	// todo: kodiAdapter.removeSpin(kodi);

if (process.env.NODE_ENV=='prod') {
	console.log('prod');
	
	console.log = function() {};
	
	process.on('uncaughtException', function (err) {
		//console.error(err);
		// console.log("Node NOT Exiting...");
	});
	
}


kodi.connect();