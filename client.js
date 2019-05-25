var EventEmitter = require('events');
var net = require("net");
var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var kodiStore = plugin.createStore('Kodi Store');
var kodiInterface = require('./interface.js');

// CLIENT -----------------------

var _instance = 0;
function KodiClient(config) {
	// var host = config.host;
	// var port = (config.port || 9090);
	config.id = KodiClient.id(config);
	this.constructor();
	this.setStore(kodiStore);
	this.bindInterface(kodiInterface, config);
	
	this.log = plugin.createLogger('Kodi Client '+(_instance++));
	this.log('create', config);
	
	this.id = this.state.id;
	
	this.mq = {};
	this.lastVolumeTime = 0;
	this.reconnect = 2000;
	this.reconnectCount = 0;
	
	this._onError = this.onError.bind(this);
	this._onData = this.onData.bind(this);
	this._onClose = this.onClose.bind(this);
	this._onConnect = this.onConnect.bind(this);
}

KodiClient.prototype = new Client();
KodiClient.prototype.constructor = Client;

KodiClient.id = function(config) {
	// return Buffer.from(config.host+':'+config.port).toString('base64');
	return config.host+':'+config.port;
};

KodiClient.prototype.update = function() {
	this.getVolumeMuted();
	this.getProperties();
	this.getActivePlayers();
};

KodiClient.prototype.disconnect = function(options) {
	this.log('disconnecting...');
	if (this.client) {
		this.client.destroy();
	}
};
KodiClient.prototype.onClose = function() {
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
	var reconnecting = this.reconnect>0;
	this.reconnectCount ++;
	
	this.setState({
		connected: false,
		status: 'disconnected',
		reconnecting: reconnecting,
		
	});
	
	if (wasConnected) {
		this.log('wasConnected emit disconnect');
		this.emit('disconnect', this);
	}
	else {
		this.log('no emit disconnect', wasConnected);
	}
	
	if (reconnecting) {
		this.log('reconnecting...', this.reconnectCount);
		var me = this;
		setTimeout(function() {
			if (me.reconnect>0) me.connect();
		},this.reconnect);
	}
};
KodiClient.prototype.setReconnect = function(ms) {
	this.reconnect = ms;
};
KodiClient.prototype.stopReconnecting = function() {
	this.reconnect = 0;
	this.reconnecting = false;
};
KodiClient.prototype.onError = function(data) {
	this.log('error', data.toString());
	// destroy?
};

KodiClient.prototype.connect = function() {
	this.log('connecting', this.state.host+':'+this.state.port);
	this.setState({
		connecting: true,
		status: 'connecting'
	});
	
	this.client = new net.Socket();
	this.client.setNoDelay(true);
	var me = this;
	// this.client.setTimeout(10000, function () {
	// 	me.log('timeout', me.state);
	// 	me.client.destroy();
	// });
	this.client.on('error', this._onError);
	this.client.on('data', this._onData);
	this.client.on('close', this._onClose);
	this.client.on('connect', this._onConnect);
	this.client.connect(this.state.port, this.state.host);
	
};
KodiClient.prototype.onConnect = function() {
	console.log('client onConnect');
	var me = this;
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
	
	this.isFirstUpdate = true;
	
	this.once('volume', function() {
		// if (me.isFirstUpdate) {
		// 	me.isFirstUpdate = false;
		// }
		
		console.log('got volume!');
		
	});
	
	
	this.update();
	
	me.startMonitor();
	
	console.log('emit connect');
	me.emit('connect', me);  // emit after first data update?
	
	
	// this.emit('connect', this);  // emit after first data update?
	// this.startMonitor();
};


// INPUT COMMANDS


KodiClient.prototype.getActivePlayers = function () {
	this.queueMessage({"jsonrpc":"2.0","method":"Player.GetActivePlayers"},'_setActivePlayers');
};
KodiClient.prototype._setActivePlayers = function (result, raw) {
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
};

KodiClient.prototype.setViewModeNavigate = function () {
	this.state.playing = false;
	this.state.paused = false;
	this.state.viewMode = viewModes.NAVIGATE;
	this.navigateBack();
};


KodiClient.prototype.getPlayerId = function () {
	return this.state.playerId;
};

KodiClient.prototype.getProperties = function () {
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
};
KodiClient.prototype._setProperties = function (result) {
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
			
			position = result.time.hours*60*60*1000 + result.time.minutes*60*1000 + result.time.seconds*1000 + result.time.milliseconds;
			duration = result.totaltime.hours*60*60*1000 + result.totaltime.minutes*60*1000 + result.totaltime.seconds*1000 + result.totaltime.milliseconds;
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
		
		console.log('status', {
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
};

KodiClient.prototype.getItems = function () {
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
};
KodiClient.prototype._setItems = function (result) {
	this.log('_setItems', result);
	this.emit('_setItems');
};

KodiClient.prototype.getVolumeMuted = function () {
	this.queueMessage({"jsonrpc":"2.0","method":"Application.GetProperties","params":{properties:["volume","muted"]}}, '_setVolumeMuted');
	
};
KodiClient.prototype._setVolumeMuted = function (result) {
	this.log('_setVolumeMuted', result);
	
	if ('muted' in result) {
		this.setState({
			muted: result.muted
		});
	}
	
	if ('volume' in result) {
		var volume = Math.round(result.volume);
		this._processVolume(volume);
	}
	
	// this.emit('_setVolumeMuted');
};

function now() {
	return new Date().getTime();
}
function timeDiff(time) {
	if (typeof time === 'undefined') {
		asdf();
		process.exit();
	}
	if (time.getTime) time = time.getTime();
	return new Date().getTime() - time;
}

KodiClient.prototype._processVolume = function (volume) {
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
	
	// console.log(this.state);
	// process.exit();
	
	if (this._lastEmittedVolume !== volume) {
		this._lastEmittedVolume = volume;
		this.emit('volume', volumePercent, volume);
	}
	
};

KodiClient.prototype._processMuted = function (muted) {
	this.setState('muted', muted);
	this.emit('muted', muted);
};

//
// KodiClient.prototype.setVolume = function (volume) {
//
// };

//
// KodiClient.prototype.volumeUp = function () {
// 	var v = this.state.volume + 1;
// 	this.log('volume up', v);
// 	this.setVolume(v);
// };
// KodiClient.prototype.volumeDown = function () {
// 	var v = this.state.volume - 1;
// 	this.log('volume down', v);
// 	this.setVolume(v);
// };

KodiClient.prototype.isConnected = function() {
	//return (this.state.status === 'connected');
	return this.state.connected;
};

KodiClient.prototype.writeJson = function (d) {
	if (!this.isConnected()) {
		this.log('write while connected',this.getState(), d);
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





// KodiClient.prototype.toggleMute = function () {
// 	let state = this.getState();
// 	this.setMuted(!state.muted);
// };


// PROCESS RESULTS


function mkid() {
	return parseInt(Math.random().toString().substring(2));
}

KodiClient.prototype.queueMessage = function (data, method) {
	var id = mkid();
	data.id = id;
	this.mq[id] = method;
	this.writeJson(data);
};

KodiClient.prototype.onData = function (raw) {
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
	
	
	var lines = this._lastData.replace(/}{/g,'\}\n\{');
	
	let rows = lines.split(/\n/);
	//this.log('found rows', rows);
	
	let i;
	for (i=0;i<rows.length;i++) {
		let row = rows[i];
		try {
			let p = JSON.parse(row);
			if (p) {
				this.processData(p, row);
				
			}
		}
		catch(e) {
			
			if (i==rows.length-1) {
				this.log('last row error', i, e);
				this.log('last row str', rows[i]);
				
				this._lastData = row;
				
				return;
			}
			else {
				this.log('middle row error',i, e);
				this.log('middle row str', row);
				
			}
		}
		
	}
	this._lastData = '';
};


var viewModes = {
	'MEDIA': 'MEDIA',
	'NAVIGATE': 'NAVIGATE'
};


KodiClient.prototype.startMonitor = function () {
	if (this.monitor) {
		clearInterval(this.monitor);
	}
	
	var me = this;
	this.monitor = setInterval(function() {
		me.getActivePlayers();
		me.getProperties();
	},1000);
};
KodiClient.prototype.stopMonitor = function () {
	if (this.monitor) {
		clearInterval(this.monitor);
	}
	delete this.monitor;
};

KodiClient.prototype.processData = function (data, raw) {
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
		}
		catch(e) {
			console.error(e);
		}
	}
	else if (data.method) {
		let state = this.getState();
		
		if (data.method === 'Application.OnVolumeChanged') {
			this.log('OnVolumeChanged', data.params.data);
			let volume = Math.round(data.params.data.volume);
			let muted = data.params.data.muted;
			this.log('receive volume', volume, 'muted', volume);
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
				let position = time.hours*60*60*1000 + time.minutes*60*1000 + time.seconds*1000 + time.milliseconds;
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
			
			var playerId = (typeof player.playerid === 'number')? player.playerid : null;
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
			this.log('data',data);
		}
	}
};


// KodiClient.prototype.mute = function () {
// 	this.setMuted(true);
// };
// KodiClient.prototype.unmute = function () {
// 	let kodi = this.getState();
// 	this.setMuted(false);
// };



KodiClient.prototype.write = function (str) {
	// this.log('write', str);
	var r = this.client.write(str);
	// this.log('write r', r);
};

module.exports = KodiClient;