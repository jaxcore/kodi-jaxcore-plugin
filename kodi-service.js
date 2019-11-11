const {Service, createLogger} = require('jaxcore-plugin');
var KodiClient = require('./kodi-client');

var kodiServiceInstance;

class KodiService extends Service {
	constructor(defaults) {
		super(defaults);
		this.log = createLogger('KodiService');
		this.log('created');
		this.clients = {};
	};
	
	create(config) {
		var id = KodiService.id(config);
		config.id = id;
		
		if (id in this.clients) {
			this.log('client exists', id);
			return;
		}
		
		this.log('connect', id);
		
		this.clients[id] = new KodiClient(config);
		
		this.clients[id].on('connect', () => {
			this.emit('connect', this.clients[id]);  // TODO: emit connect-client?
		});
		this.clients[id].once('disconnect', () => {
			me.emit('disconnect', this.clients[id]);
		});
		
		return this.clients[id];
	}
	
	connect(id, callback) {
		if (callback) {
			this.clients[id].on('connect', callback);
		}
		this.clients[id].connect();
	}
	
	disconnect(id, callback) {
	}
	
	connectAll(callback) {
		log('connectAll')
		for (var id in this.clients) {
			log('connectAll', id);
			this.connect(id, callback);
		}
	}
	
	destroyInstance(serviceId, serviceConfig) {
		if (kodiServiceInstance) {
			kodiServiceInstance.destroy();
		}
	}
	
	static id(serviceConfig) {
		let id = 'kodi:'+serviceConfig.host+':'+serviceConfig.port;
		console.log('KodiService.id', serviceConfig, 'id', id);
		return id;
	}
	
	static getOrCreateInstance(serviceId, serviceConfig, callback) {
		console.log('KodiService getOrCreateInstance', serviceId, serviceConfig);
		if (!kodiServiceInstance) {
			KodiService.startService();
		}
		
		if (kodiServiceInstance.clients[serviceId]) {
			let instance = kodiServiceInstance.clients[serviceId];
			console.log('RETURNING KODI CLIENT', instance);
			process.exit();
			return instance;
		}
		else {
			console.log('CREATE KODI', serviceId, serviceConfig);
			var instance = kodiServiceInstance.create(serviceConfig);
			console.log('CREATED KODI CLIENT', instance);
			callback(null, instance);
		}
	}
	
	static startService() {
		if (!kodiServiceInstance) {
			kodiServiceInstance = new KodiService();
		}
	}
}

module.exports = KodiService;
