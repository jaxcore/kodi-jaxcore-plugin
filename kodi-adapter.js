const {Adapter} = require('jaxcore');

class KodiAdapter extends Adapter {
	static getDefaultState() {
		return {
			didSeek: false,
			isSmallSeeking: false,
			isBigSeeking: false,
			skipNext: false,
			skippedNext: false,
			didNavLeftRight: false,
			knobPushPosition: 0
		};
	}
	
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		const {spin} = devices;
		const {kodi} = services;
		
		if (!kodi) {
			console.log('no kodi', kodi);
			process.exit();
		}
		spin.rainbow(2);
		spin.lightsOff();
		
		this.addEvents(spin, {
			spin: function (diff, time) {
				this.log('spin', diff, time);
				let direction = diff > 0 ? 1 : -1;
				let adiff = Math.abs(diff);
				
				if (this.state.skipNext) {
					this.setState({
						skipNext: false
					});
					console.log('stopping skipNext');
				}
				
				if (kodi.state.playing) {
					if (kodi.state.paused) {
						spin.flash([255, 255, 0]);
					}
					else if (spin.state.knobPushed) {
						// if (spin.buffer(direction, 2, 2)) {
						this.setState({
							isBigSeeking: true
						});
						if (direction === 1) kodi.seekBigForward();
						else kodi.seekBigBackward();
						
						spin.rotate(direction, [255, 100, 100], [255, 200, 200]);
						// }
					}
					else if (spin.state.buttonPushed) {
						// if (spin.buffer(direction, 2, 2)) {
						this.setState({
							isSmallSeeking: true
						});
						if (direction === 1) kodi.seekSmallForward();
						else kodi.seekSmallBackward();
						
						spin.rotate(direction, [255, 100, 100], [0, 0, 0]);
						// }
					}
					else {
						kodi.changeVolume(diff);
						// if (direction === 1) kodi.volumeUp();
						// else kodi.volumeDown();
					}
				}
				else {
					if (direction === 1) {
						if (spin.state.knobPushed) {
							this.shuttlePage();
							
							// let wasPaging = this.state.isPaging;
							// clearInterval(this.pagingInterval);
							// this.setState({
							// 	isPaging: true
							// });
							// let shuttleDiff = this.state.knobPushPosition - spin.state.spinPosition;
							// let ashuttleDiff = Math.min(Math.abs(shuttleDiff), 8);
							// let balanceDir = shuttleDiff>0? -1: 1;
							// if (ashuttleDiff > 0) {
							// 	let startInterval = 150;
							// 	if (ashuttleDiff === 1) startInterval = 250;
							// 	let intervalAmount = startInterval + 250*(1 - ashuttleDiff/8);
							// 	console.log('shuttleDiff', shuttleDiff, intervalAmount);
							// 	const go = () => {
							// 		if (balanceDir === 1) kodi.pageDown();
							// 		else kodi.pageUp();
							// 	};
							// 	if (!wasPaging) {
							// 		go()
							// 	}
							// 	this.pagingInterval = setInterval(go, intervalAmount);
							// }
							// spin.balance(balanceDir*(ashuttleDiff/8)/3, theme.low, theme.high, theme.white);
							
						}
						else if (spin.state.buttonPushed) {
							// if (spin.buffer(direction, 3, 5)) {
							kodi.right(spin.buffer(diff, 4, 2, 100));
							this.setState({
								didNavLeftRight: true
							});
							// }
						}
						else {
							// kodi.down(spin.buffer(diff, 2, 2, 200));
							let kbuff = 2;
							let sbuff = 2;
							if (Math.abs(diff) > 8) {
								kbuff = 0;
							}
							else if (Math.abs(diff) > 2) {
								kbuff = 1;
							}
							// if (time > 200) {
							// 	kbuff = 3;
							// 	sbuff = 2;
							// }
							// else if (time > 100) kbuff = 2;
							// else if (time > 65) kbuff = 1;
							// kodi.down(spin.buffer(diff, kbuff, sbuff, 200));
							
							kodi.down(spin.buffer(diff, kbuff, sbuff, 200));
							
						}
					}
					else {
						if (spin.state.knobPushed) {
							this.shuttlePage();
							
							// let wasPaging = this.state.isPaging;
							// clearInterval(this.pagingInterval);
							// this.setState({
							// 	isPaging: true
							// });
							// let shuttleDiff = this.state.knobPushPosition - spin.state.spinPosition;
							// let ashuttleDiff = Math.min(Math.abs(shuttleDiff), 8);
							// let balanceDir = shuttleDiff>0? -1: 1;
							// if (ashuttleDiff > 0) {
							// 	let startInterval = 150;
							// 	if (ashuttleDiff === 1) startInterval = 250;
							// 	let intervalAmount = startInterval + 250*(1 - ashuttleDiff/8);
							// 	console.log('shuttleDiff', shuttleDiff, intervalAmount);
							// 	this.pagingInterval = setInterval(() => {
							// 		if (balanceDir === 1) kodi.pageDown();
							// 		else kodi.pageUp();
							// 	}, intervalAmount);
							//
							// 	if (!wasPaging) {
							// 		if (balanceDir === 1) kodi.pageDown();
							// 		else kodi.pageUp();
							// 	}
							// }
							// spin.balance(balanceDir*(ashuttleDiff/8)/3, theme.low, theme.high, theme.white);
							
							// if (spin.buffer(direction, 1, 1)) {
							// kodi.pageUp();
							// this.setState({
							// 	isPaging: true
							// });
							// }
						}
						else if (spin.state.buttonPushed) {
							// if (spin.buffer(direction, 3, 5)) {
							kodi.left(spin.buffer(diff, 4, 2, 100));
							this.setState({
								didNavLeftRight: true
							});
							// }
						}
						else {
							let kbuff = 1;
							let sbuff = 2;
							if (Math.abs(diff) > 5) {
								kbuff = 0;
							}
							// else if (Math.abs(diff) > 2) {
							// 	kbuff = 1;
							// }
							// if (time > 200) {
							// 	kbuff = 3;
							// 	sbuff = 2;
							// }
							// else if (time > 100) kbuff = 2;
							// kodi.up(spin.buffer(diff, kbuff, sbuff, 200));
							
							kodi.up(spin.buffer(diff, kbuff, sbuff, 400));
							
						}
					}
				}
			},
			button: function (pushed) {
				console.log('adapter' + this.instance, 'button', pushed);
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
				if (pushed) {
					this.setState({
						knobPushPosition: spin.state.spinPosition
					});
				}
				else {
					if (this.state.isSmallSeeking || this.state.isBigSeeking) {
						this.setState({
							isSmallSeeking: false,
							isBigSeeking: false
						});
						console.log('seeking cancelled');
						return;
					}
					
					if (this.state.isPaging) {
						clearInterval(this.pagingInterval);
						this.setState({
							isPaging: false
						});
						// console.log('isPaging cancelled');
						return;
					}
					
					if (kodi.state.playing) {
						if (kodi.state.paused) {
							spin.scale(kodi.state.volumePercent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
						}
						else {
							spin.flash([255, 255, 0]);
						}
						kodi.playPause();
					}
					else {
						kodi.select();
					}
				}
			}
		});
		
		this.addEvents(kodi, {
			volume: function (percent) {
				if (kodi.state.muted) {
					console.log('muted volume', percent);
					spin.scale(kodi.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				}
				else {
					console.log('volume', percent);
					spin.scale(kodi.state.volumePercent, theme.low, theme.high, theme.middle);
				}
			},
			playing: function () {
				console.log('playing');
				// spin.flash([0, 255, 0]);
				spin.flash(theme.success);
				
			},
			paused: function (paused) {
				console.log('paused', paused);
				if (paused) spin.flash(theme.secondary);
				else spin.flash(theme.success);
			},
			navigate: function (type, diff) {
				this.log('navigate', type, diff);
				switch (type) {
					case 'up': spin.rotate(diff, [255,0,0], [0, 0,255]); break;
					case 'down': spin.rotate(diff, [255,0,0], [0, 0,255]); break;
					case 'left': spin.rotate(diff, [255,0,0], [0, 0,255]); break;
					case 'right': spin.rotate(diff, [255,0,0], [0, 0,255]); break;
					case 'pageUp': spin.rotate(diff, [255,0,0], [0, 0,255]); break;
					case 'pageDown': spin.rotate(diff, [255,0,0], [0, 0,255]); break;
					case 'select': spin.flash([0,255,0]); break;
					case 'back': spin.flash([255,0,255]); break;
				}
			}
		});
		
		// receiver: {
		// 	volume: function(percent) {
		// 		console.log('receiver vol', percent);
		// 		spin.scale(percent, [0, 0, 255], [255, 0, 0], [255, 255, 255]);
		// 	}
		// }
		
	}
	
	shuttlePage() {
		const kodi = this.services.kodi;
		const spin = this.devices.spin;
		const theme = this.theme;
		let wasPaging = this.state.isPaging;
		clearInterval(this.pagingInterval);
		this.setState({
			isPaging: true
		});
		let shuttleDiff = this.state.knobPushPosition - spin.state.spinPosition;
		let ashuttleDiff = Math.min(Math.abs(shuttleDiff), 8);
		let balanceDir = shuttleDiff>0? -1: 1;
		let directionChanged = this.state.pagingDirection !== balanceDir;
		if (ashuttleDiff > 0) {
			let startInterval = 20;
			// if (!wasPaging)
			if (ashuttleDiff === 1) startInterval = 200;
			if (ashuttleDiff === 2) startInterval = 100;
			if (ashuttleDiff === 3) startInterval = 50;
			let intervalAmount = startInterval + 400*(1 - ashuttleDiff/8);
			console.log('shuttleDiff', shuttleDiff, intervalAmount);
			const go = () => {
				this.setState({
					pagingDirection: balanceDir
				});
				if (balanceDir === 1) kodi.pageDown();
				else kodi.pageUp();
				spin.balance(balanceDir*(ashuttleDiff/8)/3, theme.low, theme.high, theme.white);
			};
			if (!wasPaging || directionChanged) {
				go();
			}
			this.pagingInterval = setInterval(go, intervalAmount);
			spin.balance(balanceDir*(ashuttleDiff/8)/3, theme.low, theme.high, theme.white);
		}
		else spin.balance(0, theme.low, theme.high, theme.white);
	}
	
	static getServicesConfig(adapterConfig) {
		return {
			kodi: adapterConfig.profile.services.kodi
		};
	}
}

module.exports = KodiAdapter;
