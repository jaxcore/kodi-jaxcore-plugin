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

KodiService.connectAll(function (kodi) {
	console.log('connected Kodi', kodi.state);
	
	var instances = 0;
	
	// Spin.connectAll(function(spin) {
	// Spin.connectBLE(function(spin) {
	Spin.connectBLE([
		'b6fccf36ef6f419995b3b31c4eb972c6',
		'ec0203503a7f474c879d5a4202c81b61'
	], function(spin) {
		// handle reconnect
		
		// spin.on('connect', function() {
		
		instances++;
		
		var adapter = new KodiAdapter({
			spin: spin,
			kodi: kodi
		});
		
		console.log('adapter spin connected', instances);
		
		
		// });
		
		//console.log('adapter created', adapter.state);
		
		//this.addEvents();
		
	});
});
