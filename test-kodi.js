//var Spin = require('jaxcore-spin');
// var KodiAdapter = require('./adapter');
//var Kodi = require('./client');

var KodiService = require('./service');

// Spin.debug(true);

var host = process.env.KODI_HOST || 'localhost';
console.log('connecting to', host);

KodiService.add({
	host: host,
	port: 9090
});

KodiService.connectAll(function (kodi) {
	// var kodiAdapter = new KodiAdapter();
	// kodiAdapter.addDevice(kodi);
	// kodiAdapter.addSpin(spin);
	
	console.log('connected Kodi', kodi.state);
	
	// process.exit();
	
	// kodi.volumeUp();
	//
	// setTimeout(function() {
	// 	kodi.volumeUp()
	//
	// 	setTimeout(function() {
	// 		kodi.volumeUp()
	//
	// 		setTimeout(function() {
	// 			kodi.volumeUp()
	//
	// 			setTimeout(function() {
	// 				kodi.volumeUp()
	//
	// 				setTimeout(function() {
	// 					kodi.volumeUp()
	// 				},1000)
	// 			},1000)
	// 		},1000)
	// 	},1000)
	// },1000)
	// // kodi.volumeDown();
	
});

if (process.env.NODE_ENV === 'prod') {
	console.log('prod');
	
	console.log = function () {
	};
	
	process.on('uncaughtException', function (err) {
		//console.error(err);
		// console.log("Node NOT Exiting...");
	});
	
}


/*
/Users/dstein/dev/jaxcore/jaxcore-spin/lib/spin.js:185
	return this.state.connected;
	                  ^

TypeError: Cannot read property 'connected' of undefined
    at Spin.isConnected (/Users/dstein/dev/jaxcore/jaxcore-spin/lib/spin.js:185:20)
    at KodiAdapter.activateAdapter (/Users/dstein/dev/jaxcore/kodi-plugin/adapter.js:204:27)
    at KodiAdapter.onConnectKodi (/Users/dstein/dev/jaxcore/kodi-plugin/adapter.js:138:7)
    at Kodi.emit (events.js:180:13)
    at Kodi.onConnect (/Users/dstein/dev/jaxcore/kodi-plugin/client.js:222:7)
    at Socket.emit (events.js:185:15)
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1160:10)

 */