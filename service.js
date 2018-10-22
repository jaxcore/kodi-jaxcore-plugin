var EventEmitter = require('events');
var net = require("net");
var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('Kodi Service');

var KodiClient = require('./client');

function KodiService() {
	this.constructor();
	this.clients = {};
}

KodiService.prototype = new EventEmitter();
KodiService.prototype.constructor = EventEmitter;

KodiService.prototype.add = function (config) {
	var id = KodiClient.id(config);
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
};
KodiService.prototype.remove = function (id) {
	if (this.devices[id]) this.devices[id].destroy();
	delete this.devices[id]
};

KodiService.prototype.connect = function (id, callback) {
	if (callback) {
		this.clients[id].once('connect', callback);
	}
	this.clients[id].connect();
};

KodiService.prototype.disconnect = function (id, callback) {
};

KodiService.prototype.connectAll = function(callback) {
	log('connectAll')
	for (var id in this.clients) {
		log('connectAll', id)
		this.connect(id, callback);
	}
};

module.exports = new KodiService();
