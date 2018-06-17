var log = require('jaxcore-spin').createLogger('Kodi');
var EventEmitter = require('events');
var net = require("net");
var Store = require('./store');
var kodiStore = new Store('Kodi Store');


// CLIENT -----------------------

function Kodi(device) {
	log('create', device);
	
	var host = device.host;
	var port = device.port;
	var id = device.id || Kodi.createId(host, port);
	
	this.constructor();
	this.host = host;
	this.port = port;
	
	this.id = id;
	//this.lastVolumeTime = 0;
	
	this.mq = {};
	
	this.lastVolumeTime = 0;
	
	this.reconnect = 2000;
	
	this.setStore(kodiStore);
	this.setState({
		status: 'disconnected',
		reconnecting: true,
		reconnectCount: 0,
		
		id: id,
		host: host,
		port: port,
		
		volume: null,
		volumePercent: 0,
		muted: false,
		
		playerId: null,
		playing: false,
		paused: false,
		mediaType: null,
		mediaMode: null
	});
	
	this._onError = this.onError.bind(this);
	this._onData = this.onData.bind(this);
	this._onClose = this.onClose.bind(this);
	this._onConnect = this.onConnect.bind(this);
	
	
}

Kodi.prototype = new EventEmitter();
Kodi.prototype.constructor = EventEmitter;

Kodi.store = kodiStore;

Kodi.createId = function(host, port) {
	return Buffer.from(host+port).toString('base64');
};

Kodi.prototype.setStore = function(store) {
	this.store = store;
};
Kodi.prototype.setState = function(data) {
	var changes = this.store.set(this.id, data);
	this.state = this.store[this.id];
	return changes;
};
Kodi.prototype.getState = function() {
	return this.store[this.id];
};
Kodi.prototype.changedState = function (name, value) {
	if (!(name in this.state) && this.state[name] !== value) {
		var c = {};
		c[name] = value;
		this.setState(c);
		return true;
	}
	else {
		return false;
	}
};


// Kodi.prototype.setState = function(data) {
// 	this.state.vol
	
	// var changes = {};
	// var hasChanges = false;
	// if (!store[this.id]) store[this.id] = {};
	// var s = store[this.id];
	// for (var i in data) {
	// 	if (s[i] !== data[i]) {
	// 		hasChanges = true;
	// 		changes[i] = s[i] = data[i];
	// 	}
	// }
	// if (hasChanges) {
	// 	log(this.id + ' update', changes);
	// 	this.emit('update', changes);
	// }
// };

Kodi.prototype.update = function() {
	var me = this;
	
	// this.once('_setItems', function() {
	// 	me.sendPlayState();
	// 	if (callback) callback();
	// });
	
	// this.once('_setVolumeMuted', function() {
	// 	log('on _setVolumeMuted');
	// });
	
	// this.once('_setProperties', function() {
	// 	log('on _setProperties');
	// 	me.getVolumeMuted();
	// });
	//
	// this.once('_setActivePlayers', function() {
	// 	log('on _setActivePlayers');
	// 	me.getProperties();
	// });
	// this.getActivePlayers();
	
	this.getVolumeMuted();
	this.getProperties();
	this.getActivePlayers();
};

Kodi.prototype.disconnect = function(options) {
	log('disconnecting...');
	if (this.client) {
		this.client.destroy();
	}
};
Kodi.prototype.onClose = function() {
	if (this.client) {
		log('closing');
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
	var reconnectCount = this.state.reconnectCount + 1;
	
	this.setState({
		status: 'disconnected',
		reconnecting: reconnecting,
		reconnectCount
	});
	
	if (wasConnected) {
		log('wasConnected emit disconnect');
		this.emit('disconnect', this);
	}
	else {
		log('no emit disconnect', wasConnected);
	}
	
	if (reconnecting) {
		log('reconnecting...',reconnectCount);
		var me = this;
		setTimeout(function() {
			if (me.reconnect>0) me.connect();
		},this.reconnect);
	}
};
Kodi.prototype.setReconnect = function(ms) {
	this.reconnect = ms;
};
Kodi.prototype.stopReconnecting = function() {
	this.reconnect = 0;
	this.reconnecting = false;
};
Kodi.prototype.onError = function(data) {
	log('error', data.toString());
	// destroy?
};

Kodi.prototype.connect = function() {
	log('connecting', this.host+':'+this.port);
	this.setState({
		status: 'connecting'
	});
	
	this.client = new net.Socket();
	this.client.on('error', this._onError);
	this.client.on('data', this._onData);
	this.client.on('close', this._onClose);
	this.client.on('connect', this._onConnect);
	this.client.connect(this.port, this.host);
	
};
Kodi.prototype.onConnect = function() {
	this.reconnecting = false;
	this.reconnectCount = 0;
	this.setState({
		status: 'connected',
		reconnectCount: 0,
		reconnecting: false
	});
	log('connected', this.host);
	
	this.update();
	this.emit('connect', this);  // emit after first data update?
	this.startMonitor();
};


// INPUT COMMANDS


Kodi.prototype.getActivePlayers = function () {
	this.queueMessage({"jsonrpc":"2.0","method":"Player.GetActivePlayers"},'_setActivePlayers');
};
Kodi.prototype._setActivePlayers = function (result, raw) {
	log('_setActivePlayers', result, raw);
	
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
				log('MEDIA TYPE UNKNOWN?' + mediaType);
				mediaType = 'unknown';
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
				log('_setActivePlayers no player found');
				this.setState({
					playerId: null,
					playing: false
				});
			}
		}
	}
	else {
		log('_setActivePlayers', this.state);
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
	// 			console.log('playerid has changed', this.state.playerid, result[0].playerid);
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

Kodi.prototype.setViewModeNavigate = function () {
	this.state.playing = false;
	this.state.paused = false;
	this.state.viewMode = viewModes.NAVIGATE;
	this.navigateBack();
};


Kodi.prototype.getPlayerId = function () {
	return this.state.playerId;
};

Kodi.prototype.getProperties = function () {
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.queueMessage({
			"jsonrpc": "2.0",
			"method": "Player.GetProperties",
			"params": {"playerid": playerid, "properties": ["playlistid", "speed", "position", "totaltime", "time"]}
		}, '_setProperties');
	}
	else {
		log('getProperties no playerid');
		//this.getActivePlayers();
	}
};
Kodi.prototype._setProperties = function (result) {
	if (result) {
		log('_setProperties', result);
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
				log('result.speed changed', result.speed);
			}
			
		}
		if ('playlistid' in result && result.position === -1) { // playlist position is -1 means stopped
			log('position -1 stopped');
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
				
				// console.log("POSITION", position);
				// console.log("DURATION", duration);
				// console.log("POS PERCENT", positionPercent);
				
			}
			else {
				log('_setProperties nope 0');
			}
			
		}
		else {
			log('_setProperties nope 1');
		}
		
		
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
			log('_setProperties has changes', changes);
			log('_setProperties state', this.state);
			
			if ('playing' in changes) {
				log('playing has changed', changes.playing);
				log('emit playing', changes.playing);
				this.emit('playing', changes.playing);
				if (playing) {
					log('emit playing');
					this.emit('playing');
				}
				else {
					log('emit stopped');
					this.emit('stopped');
				}
			}
			if ('paused' in changes) {
				log('paused has changed', changes.paused);
				this.emit('paused', changes.paused);
			}
		}
		else {
			log('_setProperties has NO changes');
		}
	}
	// this.emit('_setProperties');
};

Kodi.prototype.getItems = function () {
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
Kodi.prototype._setItems = function (result) {
	console.log('_setItems', result);
	this.emit('_setItems');
};

Kodi.prototype.getVolumeMuted = function () {
	this.queueMessage({"jsonrpc":"2.0","method":"Application.GetProperties","params":{properties:["volume","muted"]}}, '_setVolumeMuted');
	
};
Kodi.prototype._setVolumeMuted = function (result) {
	log('_setVolumeMuted', result);
	
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
	if (time.getTime) time = time.getTime();
	return new Date().getTime() - time;
}

Kodi.prototype._processVolume = function (volume) {
	log('_processVolume', volume);
	let v = this.state.volume;
	if (v == null) {
		log('_processVolume is null, first set', volume);
	}
	if (v === volume) {
		log('_processVolume is ', volume);
		return;
	}
	if (timeDiff(this.lastVolumeTime) < 1000) {
		log('lastVolumeTime under ', 1000);
		return;
	}
	
	var volumePercent = Math.abs(volume / 100);
	
	this.setState({
		volume: volume,
		volumePercent: volumePercent
	});
	
	if (this._lastEmittedVolume !== volume) {
		this._lastEmittedVolume = volume;
		this.emit('volume', volume, volumePercent);
	}
	
};

Kodi.prototype._processMuted = function (muted) {
	if (this.changedState('muted', muted)) {
		this.emit('muted', muted);
	}
};

Kodi.prototype.setVolume = function (volume) {
	if (this.state.volume === volume) {
		log('setVolume already = '+volume);
		return;
	}
	
	log('setVolume', volume);
	
	if (volume > 100) volume = 100;
	if (volume < 0) volume = 0;
	
	if (this._sentVolume === volume) {
		log('_sentVolume =', volume);
		return;
	}
	
	log('setVolume', volume);
	//actions.volume(this.id, volume);
	
	this.lastVolumeTime = new Date().getTime();
	this._sentVolume = volume;
	
	var volumePercent = Math.abs(volume / 100);
	
	//this._sentVolume = volume;
	// actions.volume(this.id, volume);
	
	this.setState({
		volume: volume,
		volumePercent: volumePercent
	});
	
	let v = {"method": "Application.SetVolume", "params": {"volume": volume}};
	//log('write', v);
	this.writeJson(v);
	
	// if (this._lastEmittedVolume !== volume) {
		this._lastEmittedVolume = volume;
		this.emit('volume', volume, volumePercent);
	// }
};


Kodi.prototype.volumeUp = function () {
	var v = this.state.volume + 1;
	log('volume up', v);
	this.setVolume(v);
};
Kodi.prototype.volumeDown = function () {
	var v = this.state.volume - 1;
	log('volume down', v);
	this.setVolume(v);
};

Kodi.prototype.isConnected = function() {
	return (this.state.status === 'connected');
};

Kodi.prototype.writeJson = function (d) {
	if (!this.isConnected()) {
		log('write while connected',this.getState(), d);
		//process.exit();
		return;
	}
	
	if (!this.client) {
		console.log('no kodi client');
		process.exit();
	}
	
	d["jsonrpc"] = "2.0";
	//if (d["params"]) d["params"].playerid = "0";
	
	log('sending', d);
	var s = JSON.stringify(d);
	this.client.write(s);
	
};

Kodi.prototype.stop = function () {
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.writeJson({"method": "Player.Stop", "params": {"playerid": playerid}});
	}
};

Kodi.prototype.togglePaused = function () {
	console.log('---------');
	console.log('--------- CALLING kodi.togglePaused');
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.writeJson({"method": "Player.PlayPause", "params": { "playerid": playerid }});
	}
};
Kodi.prototype.navigateNext = function () {
	console.log('---------');
	console.log('--------- CALLING kodi.navigateNext');
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.writeJson({"method": "Player.GoTo", "params": {"playerid": playerid, "to": "next"}});
	}
};

Kodi.prototype.seekSmallForward = function () {
	console.log('---------');
	console.log('--------- CALLING kodi.seekSmallForward');
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "smallforward"}});
	}
};
Kodi.prototype.seekSmallBackward = function () {
	console.log('---------');
	console.log('--------- CALLING kodi.seekSmallBackward');
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "smallbackward"}});
	}
};
Kodi.prototype.seekBigForward = function () {
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "bigforward"}});
	}
};
Kodi.prototype.seekBigBackward = function () {
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": "bigbackward"}});
	}
};

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
Kodi.prototype.seek = function (ms) {
	let playerid = this.getPlayerId();
	if (playerid !== null) {
		let time = msToTime(ms);
		log('seeking to', ms, time);
		this.writeJson({"method": "Player.Seek", "params": {"playerid": playerid, "value": {"time": time}}});
	}
};

Kodi.prototype.navigateUp = function () {
	this.writeJson({"method": "Input.Up"});
};
Kodi.prototype.navigateDown = function () {
	this.writeJson({"method": "Input.Down"});
};
Kodi.prototype.navigateLeft = function () {
	this.writeJson({"method": "Input.Left"});
};
Kodi.prototype.navigateRight = function () {
	this.writeJson({"method": "Input.Right"});
};

Kodi.prototype.navigatePageDown = function () {
	this.writeJson({"method": "Input.ExecuteAction", "params": {"action":"pagedown"}});
};

Kodi.prototype.navigatePageUp = function () {
	this.writeJson({"method": "Input.ExecuteAction", "params": {"action":"pageup"}});
};


Kodi.prototype.navigateSelect = function () {
	this.writeJson({"method": "Input.Select"});
};
Kodi.prototype.navigateBack = function () {
	this.writeJson({"method": "Input.Back"});
};

Kodi.prototype.setMuted = function (muted) {
	this.writeJson({"method": "Application.SetMute", "params": {"mute": muted}});
};


// PROCESS RESULTS


function mkid() {
	return parseInt(Math.random().toString().substring(2));
}

Kodi.prototype.queueMessage = function (data, method) {
	var id = mkid();
	data.id = id;
	this.mq[id] = method;
	this.writeJson(data);
};

Kodi.prototype.onData = function (raw) {
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
		log('concating _lastData', this._lastData);
	}
	
	
	/*if (str.indexOf('}{') || str[0]!='{' || str[str.length-1]!='}') {
		log('nope {}');
	}
	else {
			let d;
			try {
				d = JSON.parse(str);
				if (d) {
					// log('success parsing onData str:', str);
					// log('success parsing onData JSON:', d);
					
					//this._lastData = '';
					
					this.processData(d, str);
					
					//return;
				}
			}
			catch (e) {
				log('onData ERROR', e);
				log('onData ERROR str:', str);
				log('---------');
			}
	}*/
	
	
	var lines = this._lastData.replace(/}{/g,'\}\n\{');
	
	let rows = lines.split(/\n/);
	//log('found rows', rows);
	
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
				log('last row error', i, e);
				log('last row str', rows[i]);
				
				this._lastData = row;
				
				return;
			}
			else {
				log('middle row error',i, e);
				log('middle row str', row);
				
			}
		}
		
	}
	this._lastData = '';
	
	return;
	// if (str[str.length-1] != '}') {
	// 	// console.log('last char = '+str[str.length-1]);
	// 	// process.exit();
	//
	// 	if (this._lastData) {
	// 		this._lastData += str;
	//
	// 		if (this._lastData[this._lastData.length-1] == '}') {
	// 			str = this._lastData;
	// 			console.log('------------------------------------------------');
	// 			console.log('------------------------------------------------');
	//
	// 			this._lastData = undefined;
	//
	// 			console.log('will process whole chunk');
	// 			console.log(str);
	//
	// 		}
	// 		else {
	// 			console.log('------------------------------------------------');
	// 			console.log('------------------------------------------------');
	//
	// 			console.log('ADDED TO LAST CHUNK');
	// 			console.log(this._lastData);
	// 			return;
	// 		}
	//
	// 		//process.exit();
	//
	// 	}
	// 	else {
	// 		this._lastData = str;
	// 		return;
	// 	}
	// }
	
	var data;
	if (str.indexOf('}{') > -1) {
		log('PARSING {}');
		
		str = str.replace(/^\{/, '');
		str = str.replace(/\}$/, '');
		var dataSplit = str.split('}{');
		var me = this;
		dataSplit.forEach(function (d, i) {
			data = '{' + d + '}';
			try {
				var d = JSON.parse(data);
				me.processData(d, str);
			}
			catch(e) {
				console.error("fail json parse, raw:");
				console.log(raw.toString());
				// process.exit();
			}
			
			// console.log('SPLIT '+i, data);
			
		});
		
		console.log('ERROR: incomplete data?');
		//process.exit();
	}
	else {
		if (str[0]=='{' && str[1])
			try {
				data = JSON.parse(str);
			}
			catch(e) {
				
				console.log('JSON parse error');
				
				console.log(raw.toString());
				
				//process.exit();
			}
		this.processData(data, str);
	}
};


var viewModes = {
	'MEDIA': 'MEDIA',
	'NAVIGATE': 'NAVIGATE'
};


Kodi.prototype.startMonitor = function () {
	if (this.monitor) {
		clearInterval(this.monitor);
	}
	
	var me = this;
	this.monitor = setInterval(function() {
		me.getActivePlayers();
		me.getProperties();
	},1000);
};
Kodi.prototype.stopMonitor = function () {
	if (this.monitor) {
		clearInterval(this.monitor);
	}
	delete this.monitor;
};

Kodi.prototype.processData = function (data, raw) {
	if (!data) {
		console.log('no data');
		return;
	}
	if (data.method == 'Playlist.OnAdd') {
		return;
	}
	
	log('received', data);
	
	if (data.id && data.id in this.mq) {
		var method = this.mq[data.id];
		try {
			//console.log('handling '+method, data);
			
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
			console.log('OnVolumeChanged', data.params.data);
			let volume = Math.round(data.params.data.volume);
			let muted = data.params.data.muted;
			log('receive volume', volume, 'muted', volume);
			this._processVolume(volume);
			this._processMuted(muted);
			
			// if (now() - this.lastVolumeTime > 1000) {
			// 	console.log('> 1s');
			// 	// actions.volume(this.id, volume, muted);
			// }
			// else {
			// 	if (state.muted != muted) {
			// 		console.log('< 1s');
			// 		// actions.muted(this.id, muted);
			// 		this.setState({
			// 			muted: muted
			// 		});
			// 	}
			// }
		}
		else if (data.method === 'Player.OnPause') {
			log('OnPause', data.params.data);
			
			// todo:
			// actions.setPaused(this.id);
			
		}
		else if (data.method === 'Player.OnStop') {
			log('ONSTOP', data.params.data);
			
			// todo:
			//actions.setStopped(this.id);
			
			//this.stopMonitor();
			
		}
		else if (data.method === 'Player.OnSeek') {
			log('Player.OnSeek item', data.params.data.item);
			log('Player.OnSeek player', data.params.data.player);
			
			if (typeof data.params.data.player.time === 'object') {
				let time = data.params.data.player.time;
				let position = time.hours*60*60*1000 + time.minutes*60*1000 + time.seconds*1000 + time.milliseconds;
				let duration = state.duration;
				if (duration > 0 && duration >= position) {
					
					let positionPercent = position / duration;
					
					console.log("POSITION", position);
					console.log("DURATION", duration);
					console.log("POS PERCENT", positionPercent);
					
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
			log('OnPlay', data.params.data);
			
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
					log('MEDIA TYPE UNKNOWN?' + mediaType);
					mediaType = 'unknown';
					mediaType = 'video';
				}
			}
			else {
				log('no item?');
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
		console.log('RAW DATA:', data.method);
		if (data.params) {
			console.log(data.params.data);
		}
		else {
			console.log('data',data);
		}
	}
};

Kodi.prototype.changeSetting = function (settingId, newValue) {
	log('changeSetting', settingId, newValue);
	var settingMethodMap = {
		volume: 'setVolume',
		position: 'seek'
	};
	if (settingMethodMap[settingId]) {
		var fn = settingMethodMap[settingId];
		this[fn](newValue);
	}
	else {
		log('no setting method', settingId);
	}
};

Kodi.prototype.createEventAction = function (actionType, options) {
	if (this[actionType]) {
		this[actionType](options);
	}
	else log('no action', actionType);
};

Kodi.prototype.toggleMute = function () {
	let state = this.getState();
	this.setMuted(!state.muted);
};

// Kodi.prototype.mute = function () {
// 	this.setMuted(true);
// };
// Kodi.prototype.unmute = function () {
// 	let kodi = this.getState();
// 	this.setMuted(false);
// };



Kodi.prototype.write = function (str) {
	// console.log('write', str);
	var r = this.client.write(str);
	// console.log('write r', r);
};

module.exports = Kodi;