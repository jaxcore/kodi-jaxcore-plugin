module.exports = {
	services: {
		kodi: {
			service: require('./kodi-service'),
			storeType: 'client'
		}
	},
	adapters: {
		kodi: require('./kodi-adapter')
	}
};