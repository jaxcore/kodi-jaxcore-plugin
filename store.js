var EventEmitter = require('events');
var createLogger = require('jaxcore-spin').createLogger;

function Store(name) {
	this.constructor();
	this.log = createLogger(name);
	this.log('created');
}
Store.prototype = new EventEmitter();
Store.prototype.constructor = EventEmitter;

// Store.prototype.log = function() {
// 	this.logger.log.apply(this.logger.log args);
// };

Store.prototype.destroy = function(id) {
	this[id].removeAllListeners('created');
	this[id].removeAllListeners('update');
	delete this[id];
	this.emit('destroyed', id);
};

Store.prototype.set = function(id, data) {
	var changes = {};
	var hasChanges = false;
	var created = false;
	if (!this[id]) {
		this[id] = data;
		this.emit('created', id, data);
		this.log('created', id, data);
		hasChanges = true;
		created = true;
		changes = data;
	}
	else {
		var s = this[id];
		for (var i in data) {
			if (s[i] !== data[i]) {
				hasChanges = true;
				changes[i] = s[i] = data[i];
			}
		}
	}
	if (hasChanges) {
		if (!created) this.log(id + ' update', changes);
		this.emit('update', id, changes);
		return changes;
	}
	else {
		return null;
	}
};

module.exports = Store;