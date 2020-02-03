module.exports = {
	services: {
		kodi: {
			service: require('./kodi-client'),
			storeType: 'client'
		}
	},
	adapters: {
		kodi: require('./kodi-adapter')
	}
};