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
	
	// console.log('kodi', kodi);
	// return;
	//
	// Spin.connectTo('3C71BF0DC810', function(spin) {
	//Spin.connectAll(function(spin) {
	Spin.connectWifi(function(spin) {
		// adapter.emit('spin-connected', spin);
		console.log('spin connected', spin);
		
		
		var adapter = new KodiAdapter(spin, kodi);
		
	});
});
