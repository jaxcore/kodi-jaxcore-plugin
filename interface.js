var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('Kodi');

function msToTime(ms) {
	let hours = Math.floor(ms / 60 / 60 / 1000);
	ms -= hours*60*60*1000;
	let minutes = Math.floor(ms / 60 / 1000);
	ms -= minutes*60*1000;
	let seconds = Math.floor(ms / 1000);
	ms -= seconds*1000;
	let milliseconds = ms;
	return {
		hours,
		minutes,
		seconds,
		milliseconds
	};
	//return {"hours":0,"milliseconds":810,"minutes":36,"seconds":14}
}

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
		},
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
			defaultValue: 0
		},
		volumeIncrement: {
			type: 'integer',
			defaultValue: 1
		},
		playing: {
			type: 'boolean',
			defaultValue: false
		},
		playlistId: {
			type: 'string'
		},
		paused: {
			type: 'boolean',
			defaultValue: false
		},
		speed: {
			type: 'integer',
			defaultValue: 1
		},
		position: {
			type: 'integer',
			defaultValue: 1
		},
		positionPercent: {
			type: 'float',
			defaultValue: 0
		},
		duration: {
			type: 'integer',
			defaultValue: 1
		},
		viewMode: {
			type: 'string'
		},
		playerId: {
			type: 'string'
		},
		mediaType: {
			type: 'string'
		},
		mediaMode: {
			type: 'string'
		},
		
	},
	devices: {
		audio: {
			events: {
				volume: ['int', 'float'],
				mute: ['boolean']
			},
			actions: {
				volumeUp: function () {
					var v = this.state.volume + this.state.volumeIncrement;
					log('volumeUp', v, this.state.volume, this.state.volumeIncrement)
					this.audio.volume(v);
				},
				volumeDown: function () {
					var v = this.state.volume - this.state.volumeIncrement;
					log('volumeDown', v, this.state.volume, this.state.volumeIncrement)
					this.audio.volume(v);
				},
				toggleMuted: function () {
					var muted = !this.state.muted;
					this.audio.muted(muted);
				},
				mute: function () {
					this.audio.muted(true);
				},
				unmute: function () {
					this.audio.muted(false);;
				}
			},
			settings: {
				volume: function (v) {
					console.log('auido.volume()', v);
					
					if (this.state.sentVolume === v) {
						log('volume already', v);
					}
					else {
						console.log('v', v);

						//log('volume()', v); //, this.state.audio);

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

						if (v > this.state.maxVolume) {
							log(v + ' exceeds maximum volume');
							if (this.state.volume !== this.state.maxVolume) {
								log('setting volume to maximum');
								v = this.state.maxVolume;
							}
							else {
								log('already at max');
								return;
							}
						}
						if (v < this.state.minVolume) {
							log(v + ' below minimum volume');
							if (this.state.volume !== this.state.minVolume) {
								log('setting volume to minimum');
								v = this.state.minVolume;
							}
							else {
								log('already at min');
								return;
							}
						}

						//this.lastWrittenVolume = int;

						var volumePercent = (v - this.state.minVolume) / Math.abs(this.state.maxVolume - this.state.minVolume);
						var now = new Date().getTime();
						this.setState({
							volume: v,
							volumePercent: volumePercent,
							sentVolumeTime: now,
							sentVolume: v
						});

						// if (volume > 100) volume = 100;
						// if (volume < 0) volume = 0;

						// this.log('setVolume', volume);

						this.lastVolumeTime = new Date().getTime();
						// this._sentVolume = v;

						// var volumePercent = Math.abs(volume / 100);

						// this.setState({
						// 	volume: volume,
						// 	volumePercent: volumePercent
						// });

						let d = {"method": "Application.SetVolume", "params": {"volume": v}};
						console.log('d',d)
						this.writeJson(d);

						// if (this._lastEmittedVolume !== v) {
						// 	this._lastEmittedVolume = v;
						// 	this.emit('volume', volumePercent, v);
						// }
						
						
						this.emit('volume', volumePercent, v);

						// this.write('Z1VOL' + v + ';');
					}
				},
				
				minVolume: function (v) {
					this.setState({
						minVolume: v
					});
				},
				maxVolume: function (v) {
					this.setState({
						maxVolume: v
					});
				},
				muted: function (muted) {
					this.writeJson({"method": "Application.SetMute", "params": {"mute": muted}});
					
					// if (muted) this.audioDevice.mute();
					// else audioDevice.audio.umute();
				}
			}
			
		},
		navigate: {
			events: {
				'navigate': ['direction']
			},
			actions: {
				next: function () {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						this.writeJson({"method": "Player.GoTo", "params": {"playerid": playerid, "to": "next"}});
					}
				},
				
				up: function () {
					this.log('navigate', 'up');
					this.emit('navigate', 'up');
					this.writeJson({"method": "Input.Up"});
				},
				down: function () {
					this.log('navigate', 'down');
					this.emit('navigate', 'down');
					this.writeJson({"method": "Input.Down"});
				},
				left: function () {
					this.log('navigate', 'left');
					this.emit('navigate', 'left');
					this.writeJson({"method": "Input.Left"});
				},
				right: function () {
					this.log('navigate', 'right');
					this.emit('navigate', 'right');
					this.writeJson({"method": "Input.Right"});
				},
				pageDown: function () {
					this.log('navigate', 'pageDown');
					this.emit('navigate', 'pageDown');
					this.writeJson({"method": "Input.ExecuteAction", "params": {"action":"pagedown"}});
				},
				pageUp: function () {
					this.log('navigate', 'pageUp');
					this.emit('navigate', 'pageUp');
					this.writeJson({"method": "Input.ExecuteAction", "params": {"action":"pageup"}});
				},
				select: function () {
					this.log('navigate', 'select');
					this.emit('navigate', 'select');
					this.writeJson({"method": "Input.Select"});
				},
				back: function () {
					this.log('navigate', 'back');
					this.emit('navigate', 'back');
					this.writeJson({"method": "Input.Back"});
				}
			},
			settings: {
			
			}
		},
		player: {
			events: {
				paused: ['boolean'],
				stop: [],
			},
			actions: {
				playPause: function () {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						this.writeJson({"method": "Player.PlayPause", "params": { "playerid": playerid }});
					}
				},
				stop: function () {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						this.writeJson({"method": "Player.Stop", "params": {"playerid": playerid}});
					}
				},
				seekSmallForward: function () {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "smallforward"}});
					}
				},
				seekSmallBackward: function () {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "smallbackward"}});
					}
				},
				seekBigForward: function () {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "bigforward"}});
					}
				},
				seekBigBackward: function () {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "bigbackward"}});
					}
				},
			},
			settings: {
				seek: function (ms) {
					let playerid = this.getPlayerId();
					if (playerid !== null) {
						let time = msToTime(ms);
						this.log('seeking to', ms, time);
						this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": {"time": time}}});
					}
				}
			}
		}
	},
	
	parsers: {}
	
};
