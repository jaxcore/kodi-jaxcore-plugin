var Spin = require('jaxcore-spin');
var plugin = require('jaxcore-plugin');
var KodiService = require('./service');

var host = process.env.KODI_HOST || 'localhost';
console.log('connecting to', host);

KodiService.add({
	host: host,
	port: 9090
});

var KodiAdapter = require('./adapter2');

// var adapter = plugin.createStore('Kodi Adapter Store');
// adapter.setState({
// 	isSmallSeeking: false,
// 	isBigSeeking: false,
// 	isPaging: false
// });


var anthemService = require('../anthem-plugin/service');

anthemService.on('connect', function(receiver) {
	console.log('connected', typeof receiver);


	KodiService.connectAll(function (kodi) {
		console.log('connected Kodi', kodi.state);

		// console.log('kodi', kodi);
		// return;
		//
		// Spin.connectTo('3C71BF0DC810', function(spin) {
		//Spin.connectAll(function(spin) {

		Spin.connectAll(function(spin) {
			// handle reconnect

			// adapter.emit('spin-connected', spin);
			console.log('spin connected', spin);
			
			var devices = {
				spin: spin,
				kodi: kodi,
				receiver: receiver
			};
			var adapter = new KodiAdapter(devices);

		});
	});

});


anthemService.connect({
	host: '192.168.0.13',
	port: 14999
});


