const {Service, createLogger} = require('jaxcore');
var KodiClient = require('./kodi-client');

const log = createLogger('Kodi');

var kodiServiceInstance;

class KodiService extends Service {
	constructor(defaults) {
		super(defaults);
		this.log = createLogger('KodiService');
		this.log('created');
		this.clients = {};
	};
	
	create(config, serviceStore) {
		var id = KodiService.id(config);
		config.id = id;
		
		if (id in this.clients) {
			this.log('client exists', id);
			return;
		}
		
		this.log('connect', id);
		
		
		this.clients[id] = new KodiClient(config, serviceStore);
		
		this.clients[id].on('connect', () => {
			this.emit('connect', this.clients[id]);  // TODO: emit connect-client?
		});
		this.clients[id].once('disconnect', () => {
			this.emit('disconnect', this.clients[id]);
		});
		
		return this.clients[id];
	}
	
	connect(id, callback) {
		console.log('IS THIS CALLED?');
		process.exit();
		
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
		log('KodiService.id', serviceConfig, 'id', id);
		return id;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		log('KodiService getOrCreateInstance', serviceId, serviceConfig);
		if (!kodiServiceInstance) {
			KodiService.startService();
		}
		
		if (kodiServiceInstance.clients[serviceId]) {
			let instance = kodiServiceInstance.clients[serviceId];
			log('RETURNING KODI CLIENT', instance);
			process.exit();
			return instance;
		}
		else {
			log('CREATE KODI', serviceId, serviceConfig);
			var instance = kodiServiceInstance.create(serviceConfig, serviceStore);
			log('CREATED KODI CLIENT', instance);
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
