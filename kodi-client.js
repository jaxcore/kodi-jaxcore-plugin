const net = require("net");
const {Client, createLogger} = require('jaxcore');
// const kodiStore = createStore('Kodi Client Store');

function timeDiff(time) {
	if (typeof time === 'undefined') {
		asdf();
		process.exit();
	}
	if (time.getTime) time = time.getTime();
	return new Date().getTime() - time;
}

var viewModes = {
	'MEDIA': 'MEDIA',
	'NAVIGATE': 'NAVIGATE'
};

function mkid() {
	return parseInt(Math.random().toString().substring(2));
}

const schema = {
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
	connected: {
		type: 'boolean',
		defaultValue: false
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
	}
};

const kodiInstances = {};

var _instance = 0;
class KodiClient extends Client {
	constructor(defaults, store) {
		super(schema, store, defaults);
		
		this.log = createLogger('Kodi Client ' + (_instance++));
		this.log('create', defaults);
		
		// this.id = this.state.id;
		
		this.mq = {};
		this.lastVolumeTime = 0;
		this.reconnectable = true;
		this.reconnectTimeout = 2000;
		this.reconnectCount = 0;
		
		this._onError = this.onError.bind(this);
		this._onData = this.onData.bind(this);
		this._onClose = this.onClose.bind(this);
		this._onConnect = this.onConnect.bind(this);
	}
	
	update() {
		this.getVolumeMuted();
		this.getProperties();
		this.getActivePlayers();
	}
	
	disconnect(options) {
		this.log('disconnecting...');
		if (this.client) {
			this.client.destroy();
		}
	}
	
	onClose() {
		if (this.client) {
			this.log('closing');
			this.client.removeAllListeners('connect');
			this.client.removeAllListeners('error');
			this.client.removeAllListeners('data,');
			this.client.removeAllListeners('close');
			this.client.destroy();
			delete this.client;
		}
		
		this.stopMonitor();
		
		var wasConnected = this.isConnected();
		var reconnecting = this.reconnectable; // > 0;
		
		this.reconnectCount++;
		
		this.setState({
			connected: false,
			status: 'disconnected',
			reconnecting: reconnecting
		});
		
		// if (reconnecting && wasConnected) {
		//	this.emit('reconnecting', this);
		// }
		// if (!reconnecting && wasConnected) {
		if (wasConnected) {
			// only emit disconnect if not reconnecting
			this.log('wasConnected emit disconnect');
			this.emit('disconnect', this, reconnecting);
		}
		else {
			this.log('no emit disconnect', wasConnected);
		}
		
		if (reconnecting) {
			this.log('reconnecting...', this.reconnectCount);
			setTimeout(() => {
				// if (this.reconnect > 0) this.connect();
				//if (this.reconnectable)
				this._connect();
			}, this.reconnectTimeout);
		}
	}
	
	// setReconnect = function(ms) {
	// 	this.reconnect = ms;
	// };
	// stopReconnecting = function() {
	// 	this.reconnect = 0;
	// 	this.reconnecting = false;
	// };
	
	onError(data) {
		this.log('error', data.toString());
		// destroy?
	}
	
	connect() {
		this.setState({
			reconnectable: true
		});
		this._connect();
	}
	// todo: test
	_connect() {
		this.log('connecting', this.state.host + ':' + this.state.port);
		this.setState({
			connecting: true,
			status: 'connecting'
		});
		this.client = new net.Socket();
		this.client.setNoDelay(true);
		this.client.on('error', this._onError);
		this.client.on('data', this._onData);
		this.client.on('close', this._onClose);
		this.client.on('connect', this._onConnect);
		this.client.connect(this.state.port, this.state.host);
	}
	
	onConnect() {
		this.log('client onConnect');
		this.reconnecting = false;
		this.reconnectCount = 0;
		this.setState({
			connected: true,
			connecting: false,
			status: 'connected',
			reconnectCount: 0,
			reconnecting: false
		});
		this.log('connected', this.state.host);
		
		//this.isFirstUpdate = true;
		
		this.update();
		this.startMonitor();
		this.emit('connect', this);
	}
	
	// INPUT COMMANDS
	
	getActivePlayers() {
		this.queueMessage({"jsonrpc": "2.0", "method": "Player.GetActivePlayers"}, '_setActivePlayers');
	}
	
	_setActivePlayers(result, raw) {
		// this.log('_setActivePlayers', result, raw);
		
		if (result && result[0]) {
			if (typeof result[0].playerid === 'number') {
				var playerId = result[0].playerid;
				var mediaType = 'video';
				var mediaMode = 'file';
				
				let type = result[0].type;
				if (type === 'movie' || type === 'movies') {
					/*
					 { title: 'Fast and the Furious 5 - Fast Five.mkv',
					 type: 'movies' },
					 */
					mediaType = 'video';
				}
				else if (type === 'song' || type === 'audio') {
					/*
					 { album: 'Fixer',
					 artist: [ 'Download' ],
					 title: 'Sorcear',
					 track: 6,
					 type: 'song' },
					 */
					mediaType = 'audio';
				}
				else if (type === 'episode') {
					mediaType = 'video';
					mediaMode = 'livestream';
				}
				else {
					// this.log('MEDIA TYPE UNKNOWN?' + mediaType);
					// mediaType = 'unknown';
					mediaType = 'video';
				}
				
				this.setState({
					playerId: playerId,
					mediaType: mediaType,
					mediaMode: mediaMode,
					playing: true
				});
			}
			else {
				if (this.state.playing) {
					this.log('_setActivePlayers no player found');
					this.setState({
						playerId: null,
						playing: false
					});
				}
			}
		}
		else {
			// this.log('_setActivePlayers', this.state);
		}
		
		// if (result && result.length > 0) {
		//
		// 	this.state.viewMode = viewModes.MEDIA;
		//
		// 	this.state.playing = true;
		//
		// 	if (typeof result[0].playerid != 'undefined') {
		//
		// 		if (this.state.playerid != result[0].playerid) {
		// 			this.log('playerid has changed', this.state.playerid, result[0].playerid);
		//
		// 			this.state.playerid = result[0].playerid;
		//
		// 			//process.exit();
		// 		}
		// 	}
		//
		// 	if (typeof result[0].type != 'undefined') {
		// 		this.state.mediaType = result[0].type;
		// 	}
		//
		// 	if (typeof result[0].playlistid != 'undefined') {
		// 		this.state.playlistid = result[0].playlistid;
		// 	}
		// }
		// else {
		// 	this.state.playerid = 0;
		// 	this.state.playlistid = 0;
		// 	this.state.mediaType = '';
		// 	this.state.playing = false;
		// 	this.state.paused = false;
		// 	this.state.viewMode = viewModes.NAVIGATE;
		// }
		
		this.emit('_setActivePlayers');
	}
	
	setViewModeNavigate() {
		this.state.playing = false;
		this.state.paused = false;
		this.state.viewMode = viewModes.NAVIGATE;
		this.navigateBack();
	}
	
	getPlayerId() {
		return this.state.playerId;
	}
	
	getProperties() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.queueMessage({
				"jsonrpc": "2.0",
				"method": "Player.GetProperties",
				"params": {"playerid": playerid, "properties": ["playlistid", "speed", "position", "totaltime", "time"]}
			}, '_setProperties');
		}
		else {
			// this.log('getProperties no playerid');
			//this.getActivePlayers();
		}
	}
	
	_setProperties(result) {
		if (result) {
			//this.log('_setProperties', result);
			let playing = true;
			
			// if (result.speed > 0) {
			// 	playing = true;
			// }
			//
			
			let paused = false;
			var speed = result.speed;
			
			if (typeof result.speed !== 'undefined') {
				paused = (result.speed === 0);
				if (this.state.speed !== speed) {
					this.log('result.speed changed', result.speed);
				}
				
			}
			if ('playlistid' in result && result.position === -1) { // playlist position is -1 means stopped
				// this.log('position -1 stopped');
				playing = false;
				paused = false;
			}
			
			let playlistId = result.playlistid;
			let position;
			let positionPercent = 0;
			let duration;
			
			if (typeof result.time === 'object' && typeof result.totaltime === 'object') {
				
				position = result.time.hours * 60 * 60 * 1000 + result.time.minutes * 60 * 1000 + result.time.seconds * 1000 + result.time.milliseconds;
				duration = result.totaltime.hours * 60 * 60 * 1000 + result.totaltime.minutes * 60 * 1000 + result.totaltime.seconds * 1000 + result.totaltime.milliseconds;
				if (duration > 0 && duration >= position) {
					
					positionPercent = position / duration;
					
					// this.log("POSITION", position);
					// this.log("DURATION", duration);
					// this.log("POS PERCENT", positionPercent);
					
				}
				else {
					//this.log('_setProperties nope 0');
				}
				
			}
			else {
				// this.log('_setProperties nope 1');
			}
			
			this.log('status', {
				playing: playing,
				paused: paused,
				position: position
			});
			
			var changes = this.setState({
				playing: playing,
				playlistId: playlistId,
				paused: paused,
				speed: speed,
				position: position,
				positionPercent: positionPercent,
				duration: duration
			});
			if (changes && changes !== null) {
				// this.log('_setProperties has changes', changes);
				// this.log('_setProperties state', this.state);
				
				if ('playing' in changes) {
					this.log('playing has changed', changes.playing);
					this.log('emit playing', changes.playing);
					this.emit('playing', changes.playing);
					if (playing) {
						this.log('emit playing');
						this.emit('playing');
					}
					else {
						this.log('emit stopped');
						this.emit('stopped');
					}
				}
				
				if ('paused' in changes) {
					
					this.log('paused has changed', changes.paused);
					this.emit('paused', changes.paused);
				}
			}
			else {
				// this.log('_setProperties has NO changes');
			}
		}
		// this.emit('_setProperties');
	}
	
	getItems() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.queueMessage({
				"jsonrpc": "2.0",
				"method": "Playlist.GetItems",
				"id": playerid,
				"params": {
					"playlistid": 1,
					"properties": ["title", "season", "episode", "plot", "runtime", "showtitle", "thumbnail"]
				}
			}, '_setItems');
		}
	}
	
	_setItems(result) {
		this.log('_setItems', result);
		this.emit('_setItems');
	}
	
	getVolumeMuted() {
		this.queueMessage({
			"jsonrpc": "2.0",
			"method": "Application.GetProperties",
			"params": {properties: ["volume", "muted"]}
		}, '_setVolumeMuted');
	}
	
	_setVolumeMuted(result) {
		this.log('_setVolumeMuted', result);
		
		if ('muted' in result) {
			let muted = result.muted;
			this.log('mute result', muted);
			if (muted) {
				this.log('MUTED');
				;
				process.exit();
			}
			this.setState({
				muted
			});
		}
		
		if ('volume' in result) {
			var volume = Math.round(result.volume);
			this._processVolume(volume);
		}
		// this.emit('_setVolumeMuted');
	}
	
	
	_processVolume(volume) {
		this.log('_processVolume', volume);
		let v = this.state.volume;
		if (v == null) {
			this.log('_processVolume is null, first set', volume);
		}
		if (v === volume) {
			this.log('_processVolume is ', volume);
			return;
		}
		
		if (timeDiff(this.lastVolumeTime) < 1000) {
			this.log('lastVolumeTime under ', 1000);
			return;
		}
		
		var volumePercent = Math.abs(volume / 100);
		
		this.setState({
			volume: volume,
			volumePercent: volumePercent
		});
		
		// this.setState('audio', {
		// 	volume: volume,
		// 	volumePercent: volumePercent
		// });
		
		// this.log(this.state);
		// process.exit();
		
		if (this._lastEmittedVolume !== volume) {
			this._lastEmittedVolume = volume;
			this.emit('volume', volumePercent, volume);
		}
		
	};
	
	_processMuted(muted) {
		if (muted) {
			this.log('MUTED?', muted);
			process.exit();
		}
		
		this.setState({muted: muted});
		this.emit('muted', muted);
	};
	
	//
	// setVolume = function (volume) {
	//
	// };
	
	//
	// volumeUp = function () {
	// 	var v = this.state.volume + 1;
	// 	this.log('volume up', v);
	// 	this.setVolume(v);
	// };
	// volumeDown = function () {
	// 	var v = this.state.volume - 1;
	// 	this.log('volume down', v);
	// 	this.setVolume(v);
	// };
	
	isConnected() {
		//return (this.state.status === 'connected');
		return this.state.connected;
	};
	
	writeJson(d) {
		if (!this.isConnected()) {
			this.log('write while not connected', this.getState(), d);
			//process.exit();
			return;
		}
		
		if (!this.client) {
			this.log('no kodi client');
			process.exit();
		}
		
		d["jsonrpc"] = "2.0";
		//if (d["params"]) d["params"].playerid = "0";
		
		// this.log('sending', d);
		var s = JSON.stringify(d);
		this.client.write(s);
		
	};
	
	
	// toggleMute = function () {
	// 	let state = this.getState();
	// 	this.setMuted(!state.muted);
	// };
	
	
	// PROCESS RESULTS
	
	
	queueMessage(data, method) {
		var id = mkid();
		data.id = id;
		this.mq[id] = method;
		this.writeJson(data);
	};
	
	onData(raw) {
		/*
		 {"id":7151250899769592,"jsonrpc":"2.0","result":{"muted":false,"volume":100}}
		 {"id":3110470012705524,"jsonrpc":"2.0","result":[{"playerid":1,"type":"video"}]}
		 */
		
		var str = raw.toString();
		
		if (!this._lastData) {
			this._lastData = str;
		}
		else {
			this._lastData += str;
			this.log('concating _lastData', this._lastData);
		}
		
		
		var lines = this._lastData.replace(/}{/g, '\}\n\{');
		
		let rows = lines.split(/\n/);
		//this.log('found rows', rows);
		
		let i;
		for (i = 0; i < rows.length; i++) {
			let row = rows[i];
			try {
				let p = JSON.parse(row);
				if (p) {
					this.processData(p, row);
					
				}
			} catch (e) {
				
				if (i == rows.length - 1) {
					this.log('last row error', i, e);
					this.log('last row str', rows[i]);
					
					this._lastData = row;
					
					return;
				}
				else {
					this.log('middle row error', i, e);
					this.log('middle row str', row);
					
				}
			}
			
		}
		this._lastData = '';
	};
	
	startMonitor() {
		if (this.monitor) {
			clearInterval(this.monitor);
		}
		
		this.monitor = setInterval(() =>{
			this.getActivePlayers();
			this.getProperties();
		}, 1000);
	}
	
	stopMonitor() {
		if (this.monitor) {
			clearInterval(this.monitor);
		}
		delete this.monitor;
	}
	
	processData(data, raw) {
		if (!data) {
			this.log('no data');
			return;
		}
		if (data.method == 'Playlist.OnAdd') {
			return;
		}
		
		// this.log('received', data);
		
		if (data.id && data.id in this.mq) {
			var method = this.mq[data.id];
			try {
				//this.log('handling '+method, data);
				
				this[method](data.result, raw);
				
				delete this.mq[data.id];
			} catch (e) {
				console.error(e);
			}
		}
		else if (data.method) {
			let state = this.getState();
			
			if (data.method === 'Application.OnVolumeChanged') {
				this.log('OnVolumeChanged', data.params.data);
				let volume = Math.round(data.params.data.volume);
				let muted = data.params.data.muted;
				if (muted) {
					this.log('MUTED X');
					process.exit();
				}
				this.log('receive volume', volume, 'muted', muted);
				
				this._processVolume(volume);
				this._processMuted(muted);
			}
			else if (data.method === 'Player.OnPause') {
				this.log('OnPause', data.params.data);
				
				// todo:
				// actions.setPaused(this.id);
				
			}
			else if (data.method === 'Player.OnStop') {
				this.log('ONSTOP', data.params.data);
				
				// todo:
				//actions.setStopped(this.id);
				
				//this.stopMonitor();
				
			}
			else if (data.method === 'Player.OnSeek') {
				this.log('Player.OnSeek item', data.params.data.item);
				this.log('Player.OnSeek player', data.params.data.player);
				
				if (typeof data.params.data.player.time === 'object') {
					let time = data.params.data.player.time;
					let position = time.hours * 60 * 60 * 1000 + time.minutes * 60 * 1000 + time.seconds * 1000 + time.milliseconds;
					let duration = state.duration;
					if (duration > 0 && duration >= position) {
						
						let positionPercent = position / duration;
						
						this.log("POSITION", position);
						this.log("DURATION", duration);
						this.log("POS PERCENT", positionPercent);
						
						this.setState({
							position: position,
							positionPercent: positionPercent,
							duration: duration
						});
						
						// todo:
						// actions.playStatus(this.id,
						// 	state.paused,
						// 	position,
						// 	duration,
						// 	positionPercent
						// );
						//this.startMonitor();
					}
					
				}
				
			}
			else if (data.method === 'Player.OnPlay') {
				this.log('OnPlay', data.params.data);
				
				var item = data.params.data.item;
				var player = data.params.data.player;
				
				var playerId = (typeof player.playerid === 'number') ? player.playerid : null;
				var speed = player.speed;
				var paused = player.speed === 0;
				var mediaType = 'video';
				var mediaMode = 'file';
				if (item) {
					let type = item.type;
					if (type === 'movie' || type === 'movies') {
						/*
						 { title: 'Fast and the Furious 5 - Fast Five.mkv',
						 type: 'movies' },
						 */
						mediaType = 'video';
					}
					else if (type === 'song' || type === 'audio') {
						/*
						 { album: 'Fixer',
						 artist: [ 'Download' ],
						 title: 'Sorcear',
						 track: 6,
						 type: 'song' },
						 */
						mediaType = 'audio';
					}
					else if (type === 'episode') {
						mediaType = 'video';
						mediaMode = 'livestream';
					}
					else {
						this.log('MEDIA TYPE UNKNOWN?' + mediaType);
						mediaType = 'unknown';
						mediaType = 'video';
					}
				}
				else {
					this.log('no item?');
				}
				
				this.setState({
					playerId: playerId,
					playing: true,
					speed: speed,
					paused: paused,
					mediaType: mediaType,
					mediaMode: mediaMode
				});
			}
		}
		
		else {
			this.log('RAW DATA:', data.method);
			if (data.params) {
				this.log(data.params.data);
			}
			else {
				this.log('data', data);
			}
		}
	}
	
	write(str) {
		// this.log('write', str);
		var r = this.client.write(str);
		// this.log('write r', r);
	}
	
	changeVolume(diff) {
		var v = this.state.volume + diff * this.state.volumeIncrement;
		this.log('changeVolume', v);
		this.volume(v);
	}
	
	volumeUp() {
		var v = this.state.volume + this.state.volumeIncrement;
		this.log('volumeUp', v, this.state.volume, this.state.volumeIncrement);
		this.volume(v);
	}
	
	volumeDown() {
		var v = this.state.volume - this.state.volumeIncrement;
		this.log('volumeDown', v, this.state.volume, this.state.volumeIncrement);
		this.volume(v);
	}
	
	toggleMuted() {
		var muted = !this.state.muted;
		this.muted(muted);
	}
	
	mute() {
		this.muted(true);
	}
	
	unmute() {
		this.muted(false);
	}
	
	volume(v) {
		this.log('auido.volume()', v);
		if (this.state.sentVolume === v) {
			this.log('volume already', v);
		}
		else {
			this.log('v', v);
			
			v = parseInt(v) || 0;
			if (isNaN(v)) {
				this.log('isNaN', v);
				return;
			}
			
			if (v > this.state.maxVolume) {
				this.log(v + ' exceeds maximum volume');
				if (this.state.volume !== this.state.maxVolume) {
					this.log('setting volume to maximum');
					v = this.state.maxVolume;
				}
				else {
					this.log('already at max');
					return;
				}
			}
			if (v < this.state.minVolume) {
				this.log(v + ' below minimum volume');
				if (this.state.volume !== this.state.minVolume) {
					this.log('setting volume to minimum');
					v = this.state.minVolume;
				}
				else {
					this.log('already at min');
					return;
				}
			}
			
			var volumePercent = (v - this.state.minVolume) / Math.abs(this.state.maxVolume - this.state.minVolume);
			var now = new Date().getTime();
			this.setState({
				volume: v,
				volumePercent: volumePercent,
				sentVolumeTime: now,
				sentVolume: v
			});
			
			this.lastVolumeTime = now;
			let d = {"method": "Application.SetVolume", "params": {"volume": v}};
			this.writeJson(d);
			this.emit('volume', volumePercent, v);
		}
	}
	
	minVolume(v) {
		this.setState({
			minVolume: v
		});
	}
	
	maxVolume(v) {
		this.setState({
			maxVolume: v
		});
	}
	
	muted(muted) {
		this.writeJson({"method": "Application.SetMute", "params": {"mute": muted}});
	}
	
	next() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.GoTo", "params": {"playerid": playerid, "to": "next"}});
		}
	}
	
	previous() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.GoTo", "params": {"playerid": playerid, "to": "previous"}});
		}
	}
	
	up(diff) {
		let d = diff;
		while (diff < 0) {
			this.log('navigate', 'up');
			this.writeJson({"method": "Input.Up"});
			diff++;
		}
		if (d < 0) this.emit('navigate', 'up', d);
	}
	
	down(diff) {
		let d = diff;
		while (diff > 0) {
			this.log('navigate', 'down');
			this.writeJson({"method": "Input.Down"});
			diff--;
		}
		if (d > 0) this.emit('navigate', 'down', d);
	}
	
	left(diff) {
		let d = diff;
		while (diff < 0) {
			this.log('navigate', 'left');
			this.writeJson({"method": "Input.Left"});
			diff++;
		}
		if (d < 0) this.emit('navigate', 'left', d);
		
		// this.log('navigate', 'left');
		// this.emit('navigate', 'left');
		// this.writeJson({"method": "Input.Left"});
	}
	
	right(diff) {
		// this.log('navigate', 'right');
		// this.emit('navigate', 'right');
		// this.writeJson({"method": "Input.Right"});
		let d = diff;
		while (diff > 0) {
			this.log('navigate', 'right');
			this.writeJson({"method": "Input.Right"});
			diff--;
		}
		if (d > 0) this.emit('navigate', 'right', d);
	}
	
	pageDown() {
		this.log('navigate', 'pageDown');
		this.emit('navigate', 'pageDown');
		this.writeJson({"method": "Input.ExecuteAction", "params": {"action": "pagedown"}});
	}
	
	pageUp() {
		this.log('navigate', 'pageUp');
		this.emit('navigate', 'pageUp');
		this.writeJson({"method": "Input.ExecuteAction", "params": {"action": "pageup"}});
	}
	
	select() {
		this.log('navigate', 'select');
		this.emit('navigate', 'select');
		this.writeJson({"method": "Input.Select"});
	}
	
	back() {
		this.log('navigate', 'back');
		this.emit('navigate', 'back');
		this.writeJson({"method": "Input.Back"});
	}
	
	playPause() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.PlayPause", "params": {"playerid": playerid}});
		}
	}
	
	stop() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.Stop", "params": {"playerid": playerid}});
		}
	}
	
	seekSmallForward() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "smallforward"}});
		}
	}
	
	seekSmallBackward() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "smallbackward"}});
		}
	}
	
	seekBigForward() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "bigforward"}});
		}
	}
	
	seekBigBackward() {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "bigbackward"}});
		}
	}
	
	seek(ms) {
		let playerid = this.getPlayerId();
		if (playerid !== null) {
			let time = msToTime(ms);
			this.log('seeking to', ms, time);
			this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": {"time": time}}});
		}
	}
	
	destroy() {
		this.log('destroy...');
		this.reconnectable = false;
		this.disconnect();
		delete kodiInstances[this.id];
	}
	
	static id(serviceConfig) {
		let id = 'kodi:'+serviceConfig.host+':'+serviceConfig.port;
		// console.log('KodiService.id', serviceConfig, 'id', id);
		return id;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		// console.log('KodiService getOrCreateInstance', serviceId, serviceConfig);
		if (kodiInstances[serviceId]) {
			callback(null, kodiInstances[serviceId], false);
		}
		else {
			serviceConfig.id = serviceId;
			kodiInstances[serviceId] = new KodiClient(serviceConfig, serviceStore);
			callback(null, kodiInstances[serviceId], true);
		}
	}
}

module.exports = KodiClient;