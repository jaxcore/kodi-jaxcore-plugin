var Spin = require('jaxcore-spin');
var KodiAdapter = require('./adapter');
var Kodi = require('./client');

Spin.debug(true);

var kodi = new Kodi({
	host: 'localhost',
	port: 9090
});

var kodiAdapter = new KodiAdapter();
kodiAdapter.addDevice(kodi);
// todo: kodiAdapter.removeDevice(kodi);

kodi.connect();

Spin.connectAll(function(spin) {
	
	kodiAdapter.addSpin(spin);
	// todo: kodiAdapter.removeSpin(kodi);
	
});

/*
Spin.connectAll(function(spin) {
	kodiAdapter.connectSpin(spin);
	
	spin.on('disconnect', function() {
		kodiAdapter.disconnectSpin(spin);
	});
});
 */


if (process.env.NODE_ENV=='prod') {
	console.log('prod');
	
	console.log = function() {};
	
	process.on('uncaughtException', function (err) {
		//console.error(err);
		// console.log("Node NOT Exiting...");
	});
	
}