var EventEmitter = require('events');
var plugin = require('jaxcore-plugin');
var log = plugin.createLogger('Kodi Adapter');
var adapterStore = plugin.createStore('Kodi Adapter Store');
var Spin = require('jaxcore-spin');

function KodiAdapter() {
	this.constructor();
	this.id = Math.random().toString().substring(2);
	this.devices = {
		kodi: null,
		spin: null
	};
	
	this.setStore(adapterStore);
	this.setState({
		id: this.id,
		
		deviceId: null,
		deviceConnected: false,
		
		spinId: null,
		spinConnected: false,
		
		adapterActive: false
	});
	
}
//
// KodiAdapter.store = new EventEmitter();
//
// KodiAdapter.store.destroy = function(id) {
// 	this[id].removeAllListeners('created');
// 	this[id].removeAllListeners('update');
// 	delete this[id];
// 	this.emit('destroyed', id);
// };
//
// KodiAdapter.store.set = function(id, data) {
// 	var changes = {};
// 	var hasChanges = false;
// 	if (!this[id]) {
// 		this[id] = data;
// 		this.emit('created', id, data);
// 		hasChanges = true;
// 		changes = data;
// 	}
// 	else {
// 		var s = this[id];
// 		for (var i in data) {
// 			if (s[i] !== data[i]) {
// 				hasChanges = true;
// 				changes[i] = s[i] = data[i];
// 			}
// 		}
// 	}
// 	if (hasChanges) {
// 		log(id + ' update', changes);
// 		this.emit('update', id, changes);
// 		return changes;
// 	}
// 	else {
// 		return null;
// 	}
// };



KodiAdapter.prototype = new EventEmitter();
KodiAdapter.prototype.constructor = EventEmitter;

KodiAdapter.prototype.setStore = function(store) {
	this.store = store;
};
KodiAdapter.prototype.setState = function(data) {
	this.store.set(this.id, data);
	this.state = this.store[this.id];
};
KodiAdapter.prototype.getState = function() {
	return this.store[this.id];
};

KodiAdapter.prototype.addDevice = function(kodi) {
	log('adding Kodi', kodi.id);
	
	this.devices.kodi = kodi;
	this.setState({
		deviceId: kodi.id,
		deviceConnected: kodi.isConnected()
	});
	
	this._onConnectKodi = this.onConnectKodi.bind(this);
	kodi.on('connect', this._onConnectKodi);
	
	this._onDisconnectKodi = this.onDisconnectKodi.bind(this);
	kodi.on('disconnect', this._onDisconnectKodi);
	
	if (kodi.isConnected()) {
		log('Kodi already connected');
		this._onConnectKodi(kodi);
	}
};
KodiAdapter.prototype.removeDevice = function(kodi) {
	this.dectivateAdapter();
	this.devices.kodi = null;
	kodi.removeListener('connect', this._onConnectKodi);
	kodi.removeListener('disconnect', this._onDisconnectKodi);
	this.removeDeviceEvents(kodi);
	this.setState({
		deviceId: null,
		deviceConnected: false
	});
};
KodiAdapter.prototype.onDisconnectKodi = function(kodi) {
	log('disconnected Kodi', kodi.id);
	this.setState({
		deviceConnected: false
	});
	
	this.dectivateAdapter();
};
KodiAdapter.prototype.onConnectKodi = function(kodi) {
	log('Kodi connected',kodi.id);
	this.setState({
		deviceConnected: true
	});
	this.activateAdapter();
}

KodiAdapter.prototype.addSpin = function(spin) {
	log('adapting spin '+spin.id);
	
	this.devices.spin = spin;
	
	this.setState({
		spinId: spin.id,
		spinConnected: spin.isConnected()
	});
	
	
	
	this._onSpinConnected = this.onSpinConnected.bind(this);
	spin.on('connect', this._onSpinConnected);
	
	this._onSpinDisconnected = this.onSpinDisconnected.bind(this);
	spin.on('disconnect', this._onSpinDisconnected);
	
	if (spin.isConnected()) {
		log('Spin',spin.id,'already connected');
		this._onSpinConnected(spin);
	}
	
};
KodiAdapter.prototype.removeSpin = function(spin) {
	
	
	this.dectivateAdapter();
	this.devices.spin = null;
	spin.removeListener('connect', this._onSpinConnected);
	spin.removeListener('disconnect', this._onSpinDisconnected);
	this.removeSpinEvents(spin);
	this.setState({
		spinId: null,
		spinConnected: false
	});
};

KodiAdapter.prototype.onSpinDisconnected = function(spin) {
	log('disconnected spin '+spin.id);
	this.spinBuffer.destroy();
	
	this.dectivateAdapter();
	
	this.setState({
		spinConnected: false
	});
};
KodiAdapter.prototype.onSpinConnected = function(spin) {
	log('connected spin '+spin.id);
	this.spinBuffer = new Spin.Buffer(spin);
	this.buffer = this.spinBuffer.spin;
	
	this.setState({
		spinConnected: true
	});
	
	this.activateAdapter();
};
KodiAdapter.prototype.activateAdapter = function() {
	var spin = this.devices.spin;
	var kodi = this.devices.kodi;
	
	if (spin && kodi && spin.isConnected() && kodi.isConnected()) {
		log('activing adapter');
		
		this._onSpin = this.onSpin.bind(this);
		spin.on('spin', this._onSpin);
		
		this._onKnob = this.onKnob.bind(this);
		spin.on('knob', this._onKnob);
		
		this._onButton = this.onButton.bind(this);
		spin.on('button', this._onButton);
		
		this._onKodiUpdate = this.onKodiUpdate.bind(this);
		kodi.on('update', this._onKodiUpdate);
		
		this._onKodiVolume = this.onKodiVolume.bind(this);
		kodi.on('volume', this._onKodiVolume);
		
		this.setState({
			adapterActive: true
		});
		
		this.emit('activated', this);
		
		return true;
	}
	else {
		var reason = {};
		if (!spin || !spin.isConnected()) reason.spin = true;
		if (!kodi || !kodi.isConnected()) reason.kodi = true;
		log('cannot activate adapter', reason, typeof spin, typeof kodi);
		if (spin) log('cannot activate adapter: spin', spin.state);
		else log('no SPIN??');
		if (kodi) log('cannot activate adapter: kodi', kodi.getState());
		else log('no KODI??');
		return false;
	}
};

KodiAdapter.prototype.onKodiUpdate = function(changes) {
	log('kodi change', changes);
};
KodiAdapter.prototype.onKodiVolume = function(volume, volumePercent) {
	log('kodi volume', volumePercent);
	this.devices.spin.scale(volumePercent);
	// this.spinAction('scale', volumePercent);
};


KodiAdapter.prototype.onSpin = function(direction, position) {
	if (this.devices.kodi.state.playing) {
		log('spin while playing', direction, position);
		if (direction === 1) {
			this.devices.kodi.volumeUp();
		}
		else {
			this.devices.kodi.volumeDown();
		}
	}
	else {
		log('spin while navigating', direction, position);
		if (direction === 1) {
			if (this.spinBuffer.spin(direction, 4, 5)) {
				this.devices.kodi.navigateDown();
			}
		}
		else {
			if (this.spinBuffer.spin(direction, 4, 5)) {
				this.devices.kodi.navigateUp();
			}
		}
	}
};

KodiAdapter.prototype.onKnob = function(pushed) {
	log('knob '+(pushed?'pushed' : 'released'));
};

KodiAdapter.prototype.onButton = function(pushed) {
	log('button '+(pushed?'pushed' : 'released'));
};

KodiAdapter.prototype.dectivateAdapter = function() {
	if (this.getState().adapterActive) {
		log('deactivating adapter');
		
		this.removeSpinEvents(this.devices.spin);
		this.removeDeviceEvents(this.devices.kodi);
		
		this.setState({
			adapterActive: false
		});
		
		this.emit('deactivated', this);
	}
	else log('adapter not active');
};
KodiAdapter.prototype.removeSpinEvents = function(spin) {
	spin.removeListener('spin', this._onSpin);
	spin.removeListener('knob', this._onKnob);
	spin.removeListener('button', this._onButton);
};
KodiAdapter.prototype.removeDeviceEvents = function(kodi) {
	kodi.removeListener('update', this._onKodiUpdate);
	kodi.removeListener('volume', this._onKodiVolume);
};
module.exports = KodiAdapter;