module.exports = function(adapter, devices) {
	var spin = devices.spin;
	var kodi = devices.kodi;
	var receiver = devices.receiver;
	
	adapter.setState({
		didSeek: false,
		isSmallSeeking: false,
		isBigSeeking: false,
		skipNext: false,
		skippedNext: false,
		didNavLeftRight: false
	});
	
	return {
		spin: {
			spin: function (direction, position) {
				console.log('adapter'+adapter.instance,'spin',direction);
				
				if (adapter.state.skipNext) {
					adapter.setState({
						skipNext: false
					});
					console.log('stopping skipNext');
				}
				
				if (kodi.state.playing) {
					if (kodi.state.paused) {
						spin.flash([255,255,0]);
					}
					else if (spin.state.knobPushed) {
						if (spin.buffer(direction, 2, 2)) {
							this.setState({
								isBigSeeking: true
							});
							if (direction === 1) kodi.player.seekBigForward();
							else kodi.player.seekBigBackward();
							
							spin.rotate(direction, [255,100,100], [255,200,200]);
						}
					}
					else if (spin.state.buttonPushed) {
						if (spin.buffer(direction, 2, 2)) {
							this.setState({
								isSmallSeeking: true
							});
							if (direction === 1) kodi.player.seekSmallForward();
							else kodi.player.seekSmallBackward();
							
							spin.rotate(direction, [255,100,100], [0,0,0]);
							
						}
					}
					else {
						if (receiver) {
							if (spin.buffer(direction, 2, 1)) {
								if (direction === 1) receiver.audio.volumeUp();
								else receiver.audio.volumeDown();
							}
						}
						else {
							if (direction === 1) kodi.audio.volumeUp();
							else kodi.audio.volumeDown();
						}
					}
				}
				else {
					if (direction === 1) {
						if (spin.state.knobPushed) {
							if (spin.buffer(direction, 1, 1)) {
								kodi.navigate.pageDown();
								adapter.setState({
									isPaging: true
								});
							}
						}
						else if (spin.state.buttonPushed) {
							if (spin.buffer(direction, 3, 5)) {
								kodi.navigate.right();
								adapter.setState({
									didNavLeftRight: true
								});
							}
						}
						else {
							if (spin.buffer(direction, 2, 2, 200)) {
								kodi.navigate.down();
							}
						}
					}
					else {
						if (spin.state.knobPushed) {
							if (spin.buffer(direction, 1, 1)) {
								kodi.navigate.pageUp();
								adapter.setState({
									isPaging: true
								});
							}
						}
						else if (spin.state.buttonPushed) {
							if (spin.buffer(direction, 3, 5)) {
								kodi.navigate.left();
								adapter.setState({
									didNavLeftRight: true
								});
							}
						}
						else {
							if (spin.buffer(direction, 2, 2, 200)) {
								kodi.navigate.up();
							}
						}
					}
				}
				
			},
			
			button: function (pushed) {
				console.log('adapter'+adapter.instance, 'button', pushed);
				if (pushed) {
					this.setState({
						skipNext: true
					});
					spin.bufferReset();
				}
				if (!pushed) {
					if (adapter.state.skippedNext) {
						console.log('button release skippedNext');
						adapter.setState({
							skippedNext: false
						});
						return;
					}
					
					if (adapter.state.didNavLeftRight) {
						console.log('button release didNavLeftRight');
						adapter.setState({
							didNavLeftRight: false
						});
						return;
					}
					
					if (adapter.state.isSmallSeeking || adapter.state.isBigSeeking) {
						adapter.setState({
							isSmallSeeking: false,
							isBigSeeking: false,
							isPaging: false
						});
						console.log('cancelled');
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
				if (adapter.state.skipNext) {
					this.setState({
						skipNext: false,
						skippedNext: true
					});
					console.log('button-hold skipNext');
					
					kodi.navigate.next();
				}
				else console.log('btton-hold no skip');
			},
			
			knob: function (pushed) {
				console.log('knob', pushed);
				if (!pushed) {
					if (adapter.state.isSmallSeeking || adapter.state.isBigSeeking) {
						adapter.setState({
							isSmallSeeking: false,
							isBigSeeking: false
						});
						console.log('seeking cancelled');
						return;
					}
					if (adapter.state.isPaging) {
						adapter.setState({
							isPaging: false
						});
						console.log('isPaging cancelled');
						return;
					}
					
					if (kodi.state.playing) {
						if (kodi.state.paused) {
							spin.scale(kodi.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 50]);
						}
						else {
							spin.flash([255,255,0]);
						}
						kodi.player.playPause();
					}
					else {
						kodi.navigate.select();
					}
				}
			}
		},
		
		kodi: {
			volume: function(percent) {
				console.log('volume', percent);
				spin.scale(percent, [0, 0, 255], [255, 0, 0], [255, 255, 50]);
			},
			navigate: function(type) {
				switch (type) {
					case 'up': spin.rotate(-1, [255,0,0], [0, 0,255]); break;
					case 'down': spin.rotate(1, [255,0,0], [0, 0,255]); break;
					case 'left': spin.rotate(-1, [255,0,0], [0, 0,255]); break;
					case 'right': spin.rotate(1, [255,0,0], [0, 0,255]); break;
					case 'pageUp': spin.rotate(-1, [255,0,0], [0, 0,255]); break;
					case 'pageDown': spin.rotate(1, [255,0,0], [0, 0,255]); break;
					case 'select': spin.flash([0,255,0]); break;
					// case 'back': spin.flash([255,0,255]); break;
				}
				
			}
		},
		
		receiver: {
			volume: function(percent) {
				console.log('receiver vol', percent);
				spin.scale(percent, [0, 0, 255], [255, 0, 0], [255, 255, 50]);
			}
		}
	};
};