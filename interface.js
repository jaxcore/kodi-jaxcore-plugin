var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('Kodi');

module.exports = {
	states: {
		id: {
			type: 'string',
			defaultValue: ''
		},
		host: {
			type: 'string',
			defaultValue: ''
		},
		port: {
			type: 'integer',
			defaultValue: 0
		},
		identity: {
			type: 'string',
			defaultValue: ''
		}
	},
	interfaces: {
		audio: {
			states: {
				muted: {
					type: 'boolean',
					defaultValue: false
				},
				volume: {
					type: 'integer',
					defaultValue: 0,
					minimum: 'minVolume',
					maximum: 'maxVolume'
				},
				volumePercent: {
					type: 'float',
					defaultValue: 0
				},
				minVolume: {
					type: 'integer',
					defaultValue: 0,
					maximumValue: 100,
					minimumValue: 0
				},
				maxVolume: {
					type: 'integer',
					defaultValue: 100,
					maximumValue: 100,
					minimumValue: 0
				},
				receivedVolume: {
					type: 'integer',
					defaultValue: -90
				},
				volumeIncrement: {
					type: 'integer',
					defaultValue: 1
				}
			},
			events: {
				volume: ['int', 'float'],
				mute: ['boolean']
			},
			actions: {
				volumeUp: function () {
					var v = this.state.audio.volume + this.state.audio.volumeIncrement;
					this.audio.volume(v);
				},
				volumeDown: function () {
					var v = this.state.audio.volume - this.state.audio.volumeIncrement;
					this.audio.volume(v);
				},
				toggleMuted: function () {
					var muted = !this.state.audio.muted;
					this.audio.muted(muted);
				},
				mute: function () {
					this.audio.muted(true);
				},
				unmute: function () {
					this.audio.muted(false);
				}
			},
			settings: {
				volume: function (v) {
					if (this.state.audio.sentVolume === v) {
						log('volume already', v);
					}
					else {
						log('volume()', v, this.state.audio);
						
						//if (int == this.lastWrittenVolume) return;
						v = parseInt(v) || 0;
						if (isNaN(v)) {
							log('isNaN', v);
							return;
						} //int = 0;
						
						//let anthem = getState()[this.id];
						
						// if (new Date().getTime() - this.lastVolumeTime < 20) {
						// 	log('skip vol');
						// 	return;
						// }
						
						if (v > this.state.audio.maxVolume) {
							log(v + ' exceeds maximum volume');
							if (this.state.audio.volume !== this.state.audio.maxVolume) {
								log('setting volume to maximum');
								v = this.state.audio.maxVolume;
							}
							else {
								log('already at max');
								return;
							}
						}
						if (v < this.state.audio.minVolume) {
							log(v + ' below minimum volume');
							if (this.state.audio.volume !== this.state.audio.minVolume) {
								log('setting volume to minimum');
								v = this.state.audio.minVolume;
							}
							else {
								log('already at min');
								return;
							}
						}
						
						//this.lastWrittenVolume = int;
						
						var volumePercent = (v - this.state.audio.minVolume) / Math.abs(this.state.audio.maxVolume - this.state.audio.minVolume);
						var now = new Date().getTime();
						this.setState('audio', {
							volume: v,
							volumePercent: volumePercent,
							sentVolumeTime: now,
							sentVolume: v
						});
						
						this.emit('volume', volumePercent, v);
						
						// this.write('Z1VOL' + v + ';');
					}
				},
				
				minVolume: function (v) {
					this.setState('audio', {
						minVolume: v
					});
				},
				maxVolume: function (v) {
					this.setState('audio', {
						maxVolume: v
					});
				},
				muted: function (muted) {
					// if (muted) this.audioDevice.mute();
					// else audioDevice.audio.umute();
				}
			}
		}
	},
	
	parsers: {}
	
};