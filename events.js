module.exports = function(adapter, devices) {
	var spin = devices.spin;
	var kodi = devices.kodi;
	var receiver = devices.receiver;
	
	adapter.setState({
		didSeek: false,
		isSmallSeeking: false,
		isBigSeeking: false,
	});
	
	return {
		spin: {
			spin: function (direction, position) {
				
				
				
				if (kodi.state.playing) {
					//this.log('spin while playing', direction, position);
					
					if (spin.state.knobPushed) {
						if (spin.buffer(direction, 2, 2)) {
							this.setState({
								isBigSeeking: true
							});
							if (direction === 1) kodi.player.seekBigForward();
							else kodi.player.seekBigBackward();
						}
					}
					else if (spin.state.buttonPushed) {
						
						// bug: still in seeking mode after this
						
						if (spin.buffer(direction, 2, 2)) {
							this.setState({
								isSmallSeeking: true
							});
							// if (direction === 1) kodi.player.seekBigForward();
							// kodi.player.seekBigBackward();
							if (direction === 1) kodi.player.seekSmallForward();
							else kodi.player.seekSmallBackward();
						}
					}
					else {
						if (spin.buffer(direction, 1, 1)) {
							
							if (receiver) {
								if (direction === 1) receiver.audio.volumeUp();
								else receiver.audio.volumeDown();
							}
							else {
								if (direction === 1) kodi.audio.volumeUp();
								else kodi.audio.volumeDown();
							}
						}
					}
				}
				else {
					if (direction === 1) {
						if (spin.state.knobPushed) {
							if (spin.buffer(direction, 2, 2)) {
								kodi.navigate.pageDown();
							}
						}
						else if (spin.state.buttonPushed) {
							if (spin.buffer(direction, 3, 5)) {
								kodi.navigate.right();
							}
						}
						else {
							if (spin.buffer(direction, 4, 5)) {
								kodi.navigate.down();
							}
						}
					}
					else {
						if (spin.state.knobPushed) {
							if (spin.buffer(direction, 2, 2)) {
								kodi.navigate.pageUp();
							}
						}
						else if (spin.state.buttonPushed) {
							if (spin.buffer(direction, 3, 5)) {
								kodi.navigate.left();
							}
						}
						else {
							if (spin.buffer(direction, 4, 5)) {
								kodi.navigate.up();
							}
						}
					}
				}
				
			},
			
			button: function (pushed) {
				console.log('button', pushed);
				if (!pushed) {
					if (adapter.state.isSmallSeeking) {
						this.setState({
							isSmallSeeking: false
						});
						return;
					}
					if (adapter.state.isBigSeeking) {
						this.setState({
							isBigSeeking: false
						});
						return;
					}
					if (kodi.state.playing) {
						kodi.player.stop();
					}
					else {
						kodi.navigate.back();
					}
				}
			},
			
			buttonHold: function () {
				// if (receiver) nextInput
				if (adapter.state.isSmallSeeking || adapter.state.isBigSeeking) {
					
					return;
				}
				console.log('button-hold');
				// kodi.system.togglePower();
			},
			
			knob: function (pushed) {
				console.log('knob', pushed);
				if (!pushed) {
					if (adapter.state.isSmallSeeking || adapter.state.isBigSeeking) {
						adapter.setState({
							isSmallSeeking: false,
							isBigSeeking: false,
							isPaging: false
						});
						return;
					}
					
					// kodi.audio.toggleMuted();
					
					if (kodi.state.playing) {
						kodi.player.playPause();
					}
					else {
						kodi.navigate.select();
					}
				}
			}
		},
		
		kodi: {
			volume: function(vol, percent) {
				console.log('vol', vol, percent);
				spin.scale(percent, 0, [0, 0, 255], [255, 0, 0], [255, 255, 50]);
			},
			navigate: function(type) {
				switch (type) {
					case 'up': spin.rotate(-1, 0, [255,0,0], [0, 0,255]); break;
					case 'down': spin.rotate(1, 0, [255,0,0], [0, 0,255]); break;
					case 'left': spin.rotate(-1, 0, [255,0,0], [0, 0,255]); break;
					case 'right': spin.rotate(1, 0, [255,0,0], [0, 0,255]); break;
					case 'pageUp': spin.rotate(-1, 0, [255,0,0], [0, 0,255]); break;
					case 'pageDown': spin.rotate(1, 0, [255,0,0], [0, 0,255]); break;
					case 'select': spin.flash([0,255,0]); break;
					// case 'back': spin.flash([255,0,255]); break;
				}
				
			}
		},
		
		receiver: {
			volume: function(percent) {
				console.log('receiver vol', percent);
				spin.scale(percent, 0, [0, 0, 255], [255, 0, 0], [255, 255, 50]);
			}
		}
	};
};