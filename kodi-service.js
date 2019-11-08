var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var KodiClient = require('./kodi-client');

var kodiServiceInstance;

function KodiService() {
	this.constructor();
	this.clients = {};
}

KodiService.prototype = new Client();
KodiService.prototype.constructor = Client;

KodiService.prototype.create = function (config) {
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



KodiService.id = function(serviceConfig) {
	let id = 'kodi:'+serviceConfig.host+':'+serviceConfig.port;
	console.log('KodiService.id', serviceConfig, 'id', id);
	return id;
};

KodiService.getOrCreateInstance = function(serviceId, serviceConfig, callback) {
	console.log('KodiService getOrCreateInstance', serviceId, serviceConfig);
	if (!kodiServiceInstance) {
		KodiService.startService();
	}
	
	if (kodiServiceInstance.clients[serviceId]) {
		let instance = kodiServiceInstance.clients[serviceId];
		console.log('RETURNING KODI CLIENT', instance);
		process.exit();
		callback(null, instance);
	}
	else {
		console.log('CREATE KODI', serviceId, serviceConfig);
		var instance = kodiServiceInstance.create(serviceConfig);
		console.log('CREATED KODI CLIENT', instance);
		
		callback(null, instance);
		// keyboardInstance = new KodiService(serviceConfig);
	}
};

KodiService.destroyInstance = function(serviceId, serviceConfig) {
	if (kodiServiceInstance) {
		kodiServiceInstance.destroy();
	}
};

KodiService.startService = function() {
	if (!kodiServiceInstance) {
		kodiServiceInstance = new KodiService();
	}
};

module.exports = KodiService;
