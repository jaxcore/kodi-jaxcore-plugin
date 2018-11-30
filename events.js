module.exports = function(spin, kodi) {
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
					if (spin.state.buttonPushed) {
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
							if (direction === 1) kodi.audio.volumeUp();
							else kodi.audio.volumeDown();
						}
					}
					
					// }
					// else {
					// 	if (spin.state.knobPushed) {
					// 		this.setState({
					// 			isSeeking: true
					// 		});
					// 		kodi.player.seekSmallBackward();
					// 	}
					// 	else if (spin.state.buttonPushed) {
					// 		this.setState({
					// 			isSeeking: true
					// 		});
					// 		kodi.player.seekBigBackward();
					// 	}
					// 	else {
					//
					// 	}
					// }
				}
				else {
					//this.log('spin while navigating', direction, position);
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
					if (adapter.isSmallSeeking || adapter.isBigSeeking) {
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
				if (adapter.isSmallSeeking || adapter.isBigSeeking) {
					adapter.setState({
						isSmallSeeking: false,
						isBigSeeking: false,
						isPaging: false
					});
					return;
				}
				console.log('button-hold');
				// kodi.system.togglePower();
			},
			
			knob: function (pushed) {
				console.log('knob', pushed);
				if (!pushed) {
					if (adapter.isSmallSeeking || adapter.isBigSeeking) {
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
				
				// spin.
			}
		}
	};
};