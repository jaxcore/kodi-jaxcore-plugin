module.exports = {
	services: {
		kodi: require('./kodi-service'),
	},
	stores: {
		kodi: 'client'
	},
	adapters: {
		kodi: require('./kodi-adapter')
	}
}