var KodiService = require('./kodi-service');
var kodiAdapter = require('./kodi-adapter');
module.exports = {
	services: {
		kodi: KodiService
	},
	adapters: {
		kodi: kodiAdapter
	}
}