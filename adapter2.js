var EventEmitter = require('events');
var net = require("net");
var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var adapterStore = plugin.createStore('Kodi Adapter Store');
var adapter = require('./events');

function KodiAdapter(devices) {
	this.constructor();
	this.log = plugin.createLogger('Kodi Adapter');
	this.devices = devices;
	this.setStore(adapterStore, true);
	
	this.events = adapter(this, devices);
	
	this.addEvents();
}

KodiAdapter.prototype = new Client();
KodiAdapter.prototype.constructor = Client;

KodiAdapter.prototype.addEvents = function() {
	
	var event, device, fn;
	var events = this.events;
	for (device in events) {
		for (event in events[device]) {
			if (this.devices[device]) {
				fn = events[device][event];
				console.log('add ',device,event);
				
				this.devices[device].on(event, fn.bind(this))
			}
			else {
				console.log('no device', device, event);
				
			}
		}
	}
	
	//
	//
	// return;
	//
	// spin.on('spin', function (direction, position) {
	// 	// console.log('spin', direction, position);
	// 	// if (spin.state.knobPushed) {
	// 	//
	// 	// }
	// 	// else {
	// 	// 	if (!kodi.state.playing) {
	// 	// 		if (spin.buffer(direction, 3, 1)) {
	// 	// 			if (direction === 1) kodi.navigate.down();
	// 	// 			else kodi.navigate.up();
	// 	// 		}
	// 	// 	}
	// 	// 	// if (spin.buffer(direction, 1, 1)) {
	// 	// 	//
	// 	// 	// 	if (direction === 1) kodi.audio.volumeUp();
	// 	// 	// 	else kodi.audio.volumeDown();
	// 	// 	// }
	// 	// }
	//
	// 	if (kodi.state.playing) {
	// 		//this.log('spin while playing', direction, position);
	//
	// 		if (spin.state.knobPushed) {
	// 			if (spin.buffer(direction, 2, 2)) {
	// 				this.setState({
	// 					isBigSeeking: true
	// 				});
	// 				if (direction === 1) kodi.player.seekBigForward();
	// 				else kodi.player.seekBigBackward();
	// 			}
	// 		}
	// 		if (spin.state.buttonPushed) {
	// 			if (spin.buffer(direction, 2, 2)) {
	// 				adapter.setState({
	// 					isSmallSeeking: true
	// 				});
	// 				// if (direction === 1) kodi.player.seekBigForward();
	// 				// kodi.player.seekBigBackward();
	// 				if (direction === 1) kodi.player.seekSmallForward();
	// 				else kodi.player.seekSmallBackward();
	// 			}
	// 		}
	// 		else {
	// 			if (spin.buffer(direction, 1, 1)) {
	// 				if (direction===1) kodi.audio.volumeUp();
	// 				else kodi.audio.volumeDown();
	// 			}
	// 		}
	//
	// 		// }
	// 		// else {
	// 		// 	if (spin.state.knobPushed) {
	// 		// 		this.setState({
	// 		// 			isSeeking: true
	// 		// 		});
	// 		// 		kodi.player.seekSmallBackward();
	// 		// 	}
	// 		// 	else if (spin.state.buttonPushed) {
	// 		// 		this.setState({
	// 		// 			isSeeking: true
	// 		// 		});
	// 		// 		kodi.player.seekBigBackward();
	// 		// 	}
	// 		// 	else {
	// 		//
	// 		// 	}
	// 		// }
	// 	}
	// 	else {
	// 		//this.log('spin while navigating', direction, position);
	// 		if (direction === 1) {
	// 			if (spin.state.knobPushed) {
	// 				if (spin.buffer(direction, 2, 2)) {
	// 					kodi.navigate.pageDown();
	// 				}
	// 			}
	// 			else if (spin.state.buttonPushed) {
	// 				if (spin.buffer(direction, 3, 5)) {
	// 					kodi.navigate.right();
	// 				}
	// 			}
	// 			else {
	// 				if (spin.buffer(direction, 4, 5)) {
	// 					kodi.navigate.down();
	// 				}
	// 			}
	// 		}
	// 		else {
	// 			if (spin.state.knobPushed) {
	// 				if (spin.buffer(direction, 2, 2)) {
	// 					kodi.navigate.pageUp();
	// 				}
	// 			}
	// 			else if (spin.state.buttonPushed) {
	// 				if (spin.buffer(direction, 3, 5)) {
	// 					kodi.navigate.left();
	// 				}
	// 			}
	// 			else {
	// 				if (spin.buffer(direction, 4, 5)) {
	// 					kodi.navigate.up();
	// 				}
	// 			}
	// 		}
	// 	}
	//
	// });
	//
	// spin.on('button', function (pushed) {
	// 	console.log('button', pushed);
	// 	if (!pushed) {
	// 		if (adapter.isSmallSeeking || adapter.isBigSeeking) {
	// 			return;
	// 		}
	// 		if (kodi.state.playing) {
	// 			kodi.player.stop();
	// 		}
	// 		else {
	// 			kodi.navigate.back();
	// 		}
	// 	}
	// });
	//
	// spin.on('button-hold', function () {
	// 	if (adapter.isSmallSeeking || adapter.isBigSeeking) {
	// 		adapter.setState({
	// 			isSmallSeeking: false,
	// 			isBigSeeking: false,
	// 			isPaging: false
	// 		});
	// 		return;
	// 	}
	// 	console.log('button-hold');
	// 	// kodi.system.togglePower();
	// });
	//
	// spin.on('knob', function (pushed) {
	// 	console.log('knob', pushed);
	// 	if (!pushed) {
	// 		if (adapter.isSmallSeeking || adapter.isBigSeeking) {
	// 			adapter.setState({
	// 				isSmallSeeking: false,
	// 				isBigSeeking: false,
	// 				isPaging: false
	// 			});
	// 			return;
	// 		}
	//
	// 		// kodi.audio.toggleMuted();
	//
	// 		if (kodi.state.playing) {
	// 			kodi.player.playPause();
	// 		}
	// 		else {
	// 			kodi.navigate.select();
	// 		}
	// 	}
	// });
	//
	
};







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
// 		this.log(id + ' update', changes);
// 		this.emit('update', id, changes);
// 		return changes;
// 	}
// 	else {
// 		return null;
// 	}
// };




// KodiAdapter.prototype.destroy = function() {
//
// };
//
// KodiAdapter.prototype.setStore = function(store) {
// 	this.store = store;
// };
// KodiAdapter.prototype.setState = function(data) {
// 	this.store.set(this.id, data);
// 	this.state = this.store[this.id];
// };
// KodiAdapter.prototype.getState = function() {
// 	return this.store[this.id];
// };
//
// KodiAdapter.prototype.addDevice = function(kodi) {
// 	this.log('adding Kodi', kodi.id);
//
// 	this.devices.kodi = kodi;
// 	this.setState({
// 		deviceId: kodi.id,
// 		deviceConnected: kodi.isConnected()
// 	});
//
// 	this._onConnectKodi = this.onConnectKodi.bind(this);
// 	kodi.on('connect', this._onConnectKodi);
//
// 	this._onDisconnectKodi = this.onDisconnectKodi.bind(this);
// 	kodi.on('disconnect', this._onDisconnectKodi);
//
// 	if (kodi.isConnected()) {
// 		this.log('Kodi already connected');
// 		this._onConnectKodi(kodi);
// 	}
// };
// KodiAdapter.prototype.removeDevice = function(kodi) {
// 	this.log('removing kodi');
//
// 	this.dectivateAdapter();
//
// 	this.devices.kodi = null;
// 	kodi.removeListener('connect', this._onConnectKodi);
// 	kodi.removeListener('disconnect', this._onDisconnectKodi);
// 	this.removeDeviceEvents(kodi);
// 	this.setState({
// 		deviceId: null,
// 		deviceConnected: false
// 	});
// };
// KodiAdapter.prototype.onDisconnectKodi = function(kodi) {
// 	this.log('disconnected Kodi', kodi.id);
// 	this.setState({
// 		deviceConnected: false
// 	});
//
// 	this.dectivateAdapter();
// };
// KodiAdapter.prototype.onConnectKodi = function(kodi) {
// 	this.log('Kodi connected',kodi.id);
// 	this.setState({
// 		deviceConnected: true
// 	});
// 	this.activateAdapter();
// }
//
// KodiAdapter.prototype.addSpin = function(spin) {
// 	this.log('adapting spin '+spin.id);
//
// 	this.devices.spin = spin;
//
// 	this.setState({
// 		spinId: spin.id,
// 		spinConnected: spin.isConnected()
// 	});
//
//
//
// 	this._onSpinConnected = this.onSpinConnected.bind(this);
// 	spin.on('connect', this._onSpinConnected);
//
// 	this._onSpinDisconnected = this.onSpinDisconnected.bind(this);
// 	spin.on('disconnect', this._onSpinDisconnected);
//
// 	if (spin.isConnected()) {
// 		this.log('Spin',spin.id,'already connected');
// 		this._onSpinConnected(spin);
// 	}
//
// };
// KodiAdapter.prototype.removeSpin = function(spin) {
//
//
// 	this.dectivateAdapter();
// 	this.devices.spin = null;
// 	spin.removeListener('connect', this._onSpinConnected);
// 	spin.removeListener('disconnect', this._onSpinDisconnected);
// 	this.removeSpinEvents(spin);
// 	this.setState({
// 		spinId: null,
// 		spinConnected: false
// 	});
// };
//
// KodiAdapter.prototype.onSpinDisconnected = function(spin) {
// 	this.log('disconnected spin '+spin.id);
// 	this.spinBuffer.destroy();
//
// 	this.dectivateAdapter();
//
// 	this.setState({
// 		spinConnected: false
// 	});
// };
// KodiAdapter.prototype.onSpinConnected = function(spin) {
// 	this.log('connected spin '+spin.id);
// 	this.spinBuffer = new Spin.Buffer(spin);
// 	this.buffer = this.spinBuffer.spin;
//
// 	this.setState({
// 		spinConnected: true
// 	});
//
// 	this.activateAdapter();
// };
// KodiAdapter.prototype.activateAdapter = function() {
// 	var spin = this.devices.spin;
// 	var kodi = this.devices.kodi;
//
// 	if (spin && kodi && spin.isConnected() && kodi.isConnected()) {
// 		this.log('activing adapter');
//
// 		this._onSpin = this.onSpin.bind(this);
// 		spin.on('spin', this._onSpin);
//
// 		this._onKnob = this.onKnob.bind(this);
// 		spin.on('knob', this._onKnob);
//
// 		this._onKnobPress = this.onKnobPress.bind(this);
// 		spin.on('knob-press', this._onKnobPress);
//
// 		this._onKnobHold = this.onKnobHold.bind(this);
// 		spin.on('knob-hold', this._onKnobHold);
//
// 		this._onButton = this.onButton.bind(this);
// 		spin.on('button', this._onButton);
//
// 		this._onButtonPress = this.onButtonPress.bind(this);
// 		spin.on('button-press', this._onButtonPress);
//
// 		this._onButtonHold = this.onButtonHold.bind(this);
// 		spin.on('button-hold', this._onButtonHold);
//
//
//
//
// 		this._onKodiUpdate = this.onKodiUpdate.bind(this);
// 		kodi.on('update', this._onKodiUpdate);
//
// 		this._onKodiVolume = this.onKodiVolume.bind(this);
// 		kodi.on('volume', this._onKodiVolume);
//
// 		this._onKodiNavigate= this.onKodiNavigate.bind(this);
// 		kodi.on('navigate', this._onKodiNavigate);
//
// 		this.setState({
// 			adapterActive: true
// 		});
//
// 		this.emit('activated', this);
//
// 		return true;
// 	}
// 	else {
// 		var reason = {};
// 		if (!spin || !spin.isConnected()) reason.spin = true;
// 		if (!kodi || !kodi.isConnected()) reason.kodi = true;
// 		this.log('cannot activate adapter', reason, typeof spin, typeof kodi);
// 		if (spin) this.log('cannot activate adapter: spin', spin.state);
// 		else this.log('no SPIN??');
// 		if (kodi) this.log('cannot activate adapter: kodi', kodi.getState());
// 		else this.log('no KODI??');
// 		return false;
// 	}
// };
//
// KodiAdapter.prototype.onKodiUpdate = function(changes) {
// 	this.log('kodi change', changes);
// };
//
// KodiAdapter.prototype.onKodiVolume = function(volumePercent, volume) {
// 	this.log('kodi volume', volumePercent);
// 	this.devices.spin.scale(volumePercent, 0);
// 	// this.spinAction('scale', volumePercent);
// };
//
// KodiAdapter.prototype.onKodiNavigate = function(direction) {
// 	this.log('on navigate', direction);
//
// 	switch (direction) {
// 		case 'up': this.devices.spin.rotate(-1, 0); break;
// 		case 'down': this.devices.spin.rotate(1, 0); break;
// 		case 'left': this.devices.spin.rotate(-1, 1); break;
// 		case 'right': this.devices.spin.rotate(1, 1); break;
// 	}
// };
//
// KodiAdapter.prototype.onSpin = function(direction, position) {
// 	if (this.devices.kodi.state.playing) {
// 		//this.log('spin while playing', direction, position);
// 		if (direction === 1) {
// 			if (this.devices.spin.state.knobPushed) {
// 				if (this.spinBuffer.spin(direction, 2, 2)) {
// 					this.setState({
// 						isSeeking: true
// 					});
// 					this.devices.kodi.seekSmallForward();
// 				}
// 			}
// 			else if (this.devices.spin.state.buttonPushed) {
// 				if (this.spinBuffer.spin(direction, 2, 2)) {
// 					this.setState({
// 						isSeeking: true
// 					});
// 					this.devices.kodi.seekBigForward();
// 				}
// 			}
// 			else {
// 				if (this.spinBuffer.spin(direction, 1, 3)) {
// 					this.devices.kodi.volumeUp();
// 				}
// 			}
// 		}
// 		else {
// 			if (this.devices.spin.state.knobPushed) {
// 				this.setState({
// 					isSeeking: true
// 				});
// 				this.devices.kodi.seekSmallBackward();
// 			}
// 			else if (this.devices.spin.state.buttonPushed) {
// 				this.setState({
// 					isSeeking: true
// 				});
// 				this.devices.kodi.seekBigBackward();
// 			}
// 			else {
// 				if (this.spinBuffer.spin(direction, 1, 3)) {
// 					this.devices.kodi.volumeDown();
// 				}
// 			}
// 		}
// 	}
// 	else {
// 		//this.log('spin while navigating', direction, position);
// 		if (direction === 1) {
// 			if (this.devices.spin.state.knobPushed) {
// 				if (this.spinBuffer.spin(direction, 2, 2)) {
// 					this.devices.kodi.navigatePageDown();
// 				}
// 			}
// 			else if (this.devices.spin.state.buttonPushed) {
// 				if (this.spinBuffer.spin(direction, 3, 5)) {
// 					this.devices.kodi.navigateRight();
// 				}
// 			}
// 			else {
// 				if (this.spinBuffer.spin(direction, 4, 5)) {
// 					this.devices.kodi.navigateDown();
// 				}
// 			}
// 		}
// 		else {
// 			if (this.devices.spin.state.knobPushed) {
// 				if (this.spinBuffer.spin(direction, 2, 2)) {
// 					this.devices.kodi.navigatePageUp();
// 				}
// 			}
// 			else if (this.devices.spin.state.buttonPushed) {
// 				if (this.spinBuffer.spin(direction, 3, 5)) {
// 					this.devices.kodi.navigateLeft();
// 				}
// 			}
// 			else {
// 				if (this.spinBuffer.spin(direction, 4, 5)) {
// 					this.devices.kodi.navigateUp();
// 				}
// 			}
// 		}
// 	}
// };
//
// KodiAdapter.prototype.onKnobHold = function() {
// 	this.log('reactivate navigation mode?'); // todo
// };
//
// KodiAdapter.prototype.onKnobPress = function() {
// 	this.log('knob pressed');
// 	if (this.state.isSeeking) {
// 		this.log('was seeking, ignore');
// 		return;
// 	}
//
// 	if (this.devices.kodi.state.playing) {
// 		this.devices.kodi.togglePaused();
// 	}
// 	else {
// 		this.devices.kodi.navigateSelect();
// 	}
// };
//
// KodiAdapter.prototype.onKnob = function(pushed) {
// 	// this.log('knob '+(pushed?'pushed' : 'released'));
// 	if (!pushed) {
// 		if (!pushed) {
// 			this.stopSeeking();
// 		}
// 	}
// };
//
// KodiAdapter.prototype.onButtonHold = function() {
//
// 	if (this.devices.kodi.state.playing) {
// 		this.devices.kodi.navigateNext();
// 	}
// };
// KodiAdapter.prototype.onButtonPress = function() {
// 	this.log('button pressed');
// 	if (this.state.isSeeking) {
// 		this.log('was seeking, ignore');
// 		return;
// 	}
// 	if (this.devices.kodi.state.playing) {
// 		this.devices.kodi.stop();
// 	}
// 	else {
// 		this.devices.kodi.navigateBack();
// 	}
// };
// KodiAdapter.prototype.onButton = function(pushed) {
// 	// this.log('button '+(pushed?'pushed' : 'released'));
// 	if (!pushed) {
// 		this.stopSeeking();
// 	}
// };
//
// KodiAdapter.prototype.stopSeeking = function() {
// 	if (this.state.isSeeking) {
// 		this.spinBuffer.delay(1000);
// 		this.spinBuffer.reset(true);
// 		this.setState({
// 			isSeeking: false
// 		});
// 	}
// };
// KodiAdapter.prototype.dectivateAdapter = function() {
// 	if (this.getState().adapterActive) {
// 		this.log('deactivating adapter');
//
// 		this.removeSpinEvents(this.devices.spin);
// 		this.removeDeviceEvents(this.devices.kodi);
//
// 		this.setState({
// 			adapterActive: false
// 		});
//
// 		this.emit('deactivated', this);
// 	}
// 	else this.log('adapter not active');
//
// };
// KodiAdapter.prototype.removeSpinEvents = function(spin) {
// 	spin.removeListener('spin', this._onSpin);
// 	spin.removeListener('knob', this._onKnob);
// 	spin.removeListener('knob-press', this._onKnobPress);
// 	spin.removeListener('button', this._onButton);
// 	spin.removeListener('button-press', this._onButtonPress);
//
// };
// KodiAdapter.prototype.removeDeviceEvents = function(kodi) {
// 	kodi.removeListener('update', this._onKodiUpdate);
// 	kodi.removeListener('volume', this._onKodiVolume);
// 	kodi.removeListener('navigate', this._onKodiNavigate);
// };
module.exports = KodiAdapter;