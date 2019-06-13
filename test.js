var Spin = require('jaxcore-spin');
var plugin = require('jaxcore-plugin');
var KodiService = require('./service');

var host = process.env.KODI_HOST || 'localhost';
console.log('connecting to', host);

var kodi = KodiService.create({
	host: host,
	port: 9090
});
kodi.on('connect', function() {
	console.log('kodi connected', kodi.state);
});
kodi.connect();


// var adapter = plugin.createStore('Kodi Adapter Store');
// adapter.setState({
// 	isSmallSeeking: false,
// 	isBigSeeking: false,
// 	isPaging: false
// });

var KodiAdapter = require('./adapter2');

var instances = 0;

if (process.argv[2] === 'usb') {
	Spin.connectUSB(function (spin) {
		instances++;
		console.log('connected usb', instances);
		spin.setSleepTimer(0);
		createAdapter(kodi, spin);
	});
}
else if (process.argv[2]) {
	Spin.connectBLE([
		'e1eaf0479a534366862ce22646d35605',
		'b6fccf36ef6f419995b3b31c4eb972c6',
		'ec0203503a7f474c879d5a4202c81b61'
	], function (spin) {
		instances++;
		console.log('connected ble', instances);
		
		createAdapter(kodi, spin);
	}, parseInt(process.argv[2]));
}
else {
	//Spin.connectBLE(function (spin) {
	Spin.connect(function (spin) {
		instances++;
		console.log('connected ble', instances);
		spin.setSleepTimer(120);
		createAdapter(kodi, spin);
	});
}

function createAdapter(kodi, spin) {
	var adapter = new KodiAdapter({
		spin: spin,
		kodi: kodi
	});
	console.log('adapter created', instances);
	
	var _interval = setInterval(function() {
		console.log('adapter:', adapter.state.id, 'active='+adapter.state.adapterActive)
	}, 1000);
	
	adapter.on('destroy', function() {
		console.log('adapter destroyed', adapter.state.id);
		clearInterval(_interval);
	});
	
}

if (process.env.NODE_ENV==='prod') {
	console.log = function () {
	};
	process.on('uncaughtException', function (err) {
	});
}