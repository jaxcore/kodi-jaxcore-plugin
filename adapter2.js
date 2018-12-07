var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var adapterStore = plugin.createStore('Kodi Adapter Store');
var adapter = require('./events');

var instances = 0;

function KodiAdapter(devices) {
	this.constructor();
	
	this.instance = instances++;
	this.log = plugin.createLogger('Kodi Adapter '+(this.instance));
	this.devices = devices;
	this.setStore(adapterStore);
	
	var id = Math.random().toString().substring(2);
	this.setState({
		id: id
	});
	
	this.events = adapter(this, devices);
	this._removeEvents = this.removeEvents.bind(this);
	this.addEvents();
}

KodiAdapter.prototype = new Client();
KodiAdapter.prototype.constructor = Client;

KodiAdapter.prototype.addEvents = function() {
	if (this.state.adapterActive) {
		this.log('already active');
		return;
	}
	
	if (this.devices.kodi.state.connected &&
		this.devices.spin.state.connected
	) {
		var event, device, fn;
		var events = this.events;
		for (device in events) {
			for (event in events[device]) {
				var evt = kebabcase(event);
				if (this.devices[device]) {
					fn = events[device][event];
					this['_' + device + '_' + event] = fn.bind(this);
					this.devices[device].addListener(evt, this['_' + device + '_' + event]);
					console.log('added event', device, event);
				}
				else {
					console.log('no device', device, event);
					
				}
			}
		}
		
		this.devices.spin.on('disconnect',this._removeEvents);
		this.devices.kodi.on('disconnect',this._removeEvents);
		
		this.setState({adapterActive: true});
		this.log('Adapter active');
	}
	else {
		this.log('kodi connected?', this.devices.kodi.state.connected);
		this.log('spin connected?', this.devices.spin.state.connected);
		//console.log('oops', this.devices.spin.state)
		// process.exit();
	}
};

function kebabcase(s) {
	return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function camelcase(s) {
	return s.replace(/\W+(.)/g, function(match, chr)
	{
		return chr.toUpperCase();
	});
}

KodiAdapter.prototype.removeEvents = function() {
	this.log('removeEvents');
	
	if (!this.state.adapterActive) {
		this.log('not active');
		return;
	}
	
	var event, device, fn;
	var events = this.events;
	for (device in events) {
		for (event in events[device]) {
			
			var evt = kebabcase(event);
			if (this.devices[device]) {
				fn = events[device][event];
				this.devices[device].removeListener(evt, this['_'+device+'_'+event]);
				this.log('removed event',device,event);
			}
			else {
				this.log('no device', device, event);
				
			}
		}
	}
	
	this.devices.spin.removeListener('disconnect',this._removeEvents);
	this.devices.kodi.removeListener('disconnect',this._removeEvents);
	
	this.setState({adapterActive:false});
	
};


module.exports = KodiAdapter;