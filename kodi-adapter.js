function getDefaultState() {
	return {
		didSeek: false,
		isSmallSeeking: false,
		isBigSeeking: false,
		skipNext: false,
		skippedNext: false,
		didNavLeftRight: false
	};
}

function kodiAdapter() {
	const {spin} = this.devices;
	const {kodi} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	this.setEvents({
		spin: {
			spin: function (diff, time) {
				this.log('spin', diff, time);
				let direction = diff>0? 1:-1;
				
				if (this.state.skipNext) {
					this.setState({
						skipNext: false
					});
					console.log('stopping skipNext');
				}
				
				if (kodi.state.playing) {
					if (kodi.state.paused) {
						spin.flash([255,255,0]);
					}
					else if (spin.state.knobPushed) {
						// if (spin.buffer(direction, 2, 2)) {
							this.setState({
								isBigSeeking: true
							});
							if (direction === 1) kodi.seekBigForward();
							else kodi.seekBigBackward();
							
							spin.rotate(direction, [255,100,100], [255,200,200]);
						// }
					}
					else if (spin.state.buttonPushed) {
						// if (spin.buffer(direction, 2, 2)) {
							this.setState({
								isSmallSeeking: true
							});
							if (direction === 1) kodi.seekSmallForward();
							else kodi.seekSmallBackward();
							
							spin.rotate(direction, [255,100,100], [0,0,0]);
						// }
					}
					else {
						// kodi.changeVolume(diff)
						if (direction === 1) kodi.volumeUp();
						else kodi.volumeDown();
					}
				}
				else {
					if (direction === 1) {
						if (spin.state.knobPushed) {
							// if (spin.buffer(direction, 1, 1)) {
								kodi.pageDown();
								this.setState({
									isPaging: true
								});
							// }
						}
						else if (spin.state.buttonPushed) {
							// if (spin.buffer(direction, 3, 5)) {
								kodi.right();
								this.setState({
									didNavLeftRight: true
								});
							// }
						}
						else {
							// if (spin.buffer(direction, 2, 2, 200)) {
								kodi.down();
							// }
						}
					}
					else {
						if (spin.state.knobPushed) {
							// if (spin.buffer(direction, 1, 1)) {
								kodi.pageUp();
								this.setState({
									isPaging: true
								});
							// }
						}
						else if (spin.state.buttonPushed) {
							// if (spin.buffer(direction, 3, 5)) {
								kodi.left();
								this.setState({
									didNavLeftRight: true
								});
							// }
						}
						else {
							// if (spin.buffer(direction, 2, 2, 200)) {
								kodi.up();
							// }
						}
					}
				}
				
			},
			
			button: function (pushed) {
				console.log('adapter'+this.instance, 'button', pushed);
				if (pushed) {
					this.setState({
						skipNext: true
					});
				}
				if (!pushed) {
					if (this.state.skippedNext) {
						console.log('button release skippedNext');
						this.setState({
							skippedNext: false
						});
						return;
					}
					
					if (this.state.didNavLeftRight) {
						console.log('button release didNavLeftRight');
						this.setState({
							didNavLeftRight: false
						});
						return;
					}
					
					if (this.state.isSmallSeeking || this.state.isBigSeeking) {
						this.setState({
							isSmallSeeking: false,
							isBigSeeking: false,
							isPaging: false
						});
						console.log('cancelled');
						return;
					}
					if (kodi.state.playing) {
						kodi.stop();
					}
					else {
						kodi.back();
					}
				}
			},
			
			buttonHold: function () {
				if (this.state.skipNext) {
					this.setState({
						skipNext: false,
						skippedNext: true
					});
					console.log('button-hold skipNext');
					
					kodi.next();
				}
				else console.log('btton-hold no skip');
			},
			
			knob: function (pushed) {
				console.log('knob', pushed);
				if (!pushed) {
					if (this.state.isSmallSeeking || this.state.isBigSeeking) {
						this.setState({
							isSmallSeeking: false,
							isBigSeeking: false
						});
						console.log('seeking cancelled');
						return;
					}
					if (this.state.isPaging) {
						this.setState({
							isPaging: false
						});
						console.log('isPaging cancelled');
						return;
					}
					
					if (kodi.state.playing) {
						if (kodi.state.paused) {
							spin.scale(kodi.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
						}
						else {
							spin.flash([255,255,0]);
						}
						kodi.playPause();
					}
					else {
						kodi.select();
					}
				}
			}
		},
		
		kodi: {
			volume: function(percent) {
				console.log('volume', percent);
				spin.scale(percent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
			},
			playing: function() {
				console.log('playing');
				spin.flash([0, 255, 0]);
			},
			paused: function(paused) {
				console.log('paused', paused);
				if (paused) spin.flash([255, 255, 0]);
				else spin.flash([0, 255, 0]);
			},
			navigate: function(type) {
				this.log('navigate', type);
				// switch (type) {
				// 	case 'up': spin.rotate(-1, [255,0,0], [0, 0,255]); break;
				// 	case 'down': spin.rotate(1, [255,0,0], [0, 0,255]); break;
				// 	case 'left': spin.rotate(-1, [255,0,0], [0, 0,255]); break;
				// 	case 'right': spin.rotate(1, [255,0,0], [0, 0,255]); break;
				// 	case 'pageUp': spin.rotate(-1, [255,0,0], [0, 0,255]); break;
				// 	case 'pageDown': spin.rotate(1, [255,0,0], [0, 0,255]); break;
				// 	case 'select': spin.flash([0,255,0]); break;
				// 	// case 'back': spin.flash([255,0,255]); break;
				// }
			}
		}
		
		// receiver: {
		// 	volume: function(percent) {
		// 		console.log('receiver vol', percent);
		// 		spin.scale(percent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
		// 	}
		// }
	});
}


kodiAdapter.getServicesConfig = function(adapterConfig) {
	console.log('kodiAdapter adapterConfig.settings.services.kodi', adapterConfig.settings.services.kodi);
	
	let servicesConfig = {
		kodi: adapterConfig.settings.services.kodi
	};
	
	return servicesConfig;
};

kodiAdapter.getDefaultState = getDefaultState;

module.exports = kodiAdapter;
