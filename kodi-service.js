// var EventEmitter = require('events');
// var net = require("net");
var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
// var log = plugin.createLogger('Kodi Service');

var KodiClient = require('./kodi-client');

var kodiServiceInstance;

function KodiService() {
	this.constructor();
	this.clients = {};
}

KodiService.prototype = new Client();
KodiService.prototype.constructor = Client;

KodiService.id = function(serviceConfig) {
	let id = 'kodi:'+serviceConfig.host+':'+serviceConfig.port;
	console.log('KodiService.id', serviceConfig, 'id', id);
	return id;
};

KodiService.getOrCreateInstance = function(serviceId, serviceConfig) {
	console.log('KodiService getOrCreateInstance', serviceId, serviceConfig);
	if (!kodiServiceInstance) {
		KodiService.startService();
	}
	
	if (kodiServiceInstance.clients[serviceId]) {
		var instance = kodiServiceInstance.clients[serviceId];
		console.log('RETURNING KODI CLIENT', instance);
		process.exit();
		return instance;
	}
	else {
		console.log('CREATE KODI', serviceId, serviceConfig);
		var instance =  kodiServiceInstance.create(serviceConfig);
		console.log('CREATED KODI CLIENT', instance);
		
		return instance;
		// keyboardInstance = new KodiService(serviceConfig);
	}
};

KodiService.destroyInstance = function(serviceId, serviceConfig) {
	if (keyboardInstance) {
		keyboardInstance.destroy();
	}
};

KodiService.prototype.create = function (config) {
	// KodiService.connectAll(function (kodi) {
	// 	console.log('connected Kodi', kodi.state);
	//
	// 	var instances = 0;
	//
	// 	// Spin.connectAll(function(spin) {
	// });
	
	return this.add(config);
};

KodiService.prototype.add = function (config) {
	var id = KodiService.id(config);
	config.id = id;
	
	if (id in this.clients) {
		log('client exists', id);
		return;
	}
	
	console.log('connect', id);
	
	this.clients[id] = new KodiClient(config);
	
	var me = this;
	this.clients[id].on('connect', function () {
		me.emit('connect', me.clients[id]);
	});
	this.clients[id].once('disconnect', function () {
		me.emit('disconnect', me.clients[id]);
	});
	
	return this.clients[id];
};
KodiService.prototype.remove = function (id) {
	if (this.devices[id]) this.devices[id].destroy();
	delete this.devices[id]
};

KodiService.prototype.connect = function (id, callback) {
	if (callback) {
		this.clients[id].on('connect', callback);
	}
	this.clients[id].connect();
};

KodiService.prototype.disconnect = function (id, callback) {
};

KodiService.prototype.connectAll = function(callback) {
	log('connectAll')
	for (var id in this.clients) {
		log('connectAll', id);
		this.connect(id, callback);
	}
};


// var kodi = KodiService.create({
// 	host: host,
// 	port: 9090
// });
// kodi.on('connect', function() {
// 	console.log('kodi connected', kodi.state);
// });
// kodi.connect();

KodiService.startService = function() {
	if (!kodiServiceInstance) {
		kodiServiceInstance = new KodiService();
	}
};

module.exports = KodiService;
