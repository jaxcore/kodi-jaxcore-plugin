var Spin = require('jaxcore-spin');
var KodiService = require('./service');

var host = process.env.KODI_HOST || 'localhost';
console.log('connecting to', host);

KodiService.add({
	host: host,
	port: 9090
});

KodiService.connectAll(function (kodi) {
	console.log('connected Kodi', kodi.state);
	
	// console.log('kodi', kodi);
	// return;
	//
	// Spin.connectTo('3C71BF0DC810', function(spin) {
	Spin.connectAll(function(spin) {
		// adapter.emit('spin-connected', spin);
		console.log('spin connected', spin);
		
		
		spin.on('spin', function (direction, position) {
			console.log('spin', direction, position);
			if (spin.state.knobPushed) {
			
			}
			else {
				if (!kodi.state.playing) {
					if (spin.buffer(direction, 3, 1)) {
						if (direction === 1) kodi.navigate.down();
						else kodi.navigate.up();
					}
				}
				// if (spin.buffer(direction, 1, 1)) {
				//
				// 	if (direction === 1) kodi.audio.volumeUp();
				// 	else kodi.audio.volumeDown();
				// }
			}
		});
		
		spin.on('button', function (pushed) {
			console.log('button', pushed);
			if (!pushed) {
				if (kodi.state.playing) {
					kodi.player.stop();
				}
				else {
					kodi.navigate.back();
				}
			}
		});
		
		spin.on('button-hold', function () {
			console.log('button-hold');
			// kodi.system.togglePower();
		});
		
		spin.on('knob', function (pushed) {
			console.log('knob', pushed);
			if (!pushed) {
				// kodi.audio.toggleMuted();
				
				if (kodi.state.playing) {
					kodi.player.playPause();
				}
				else {
					kodi.navigate.select();
				}
			}
		});
		
		
	});
});
