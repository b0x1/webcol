import 'phaser';
import NewWorld from './game/scene/NewWorld';

const gameConfig: Phaser.Types.Core.GameConfig = {
	title: 'Web Colonization',
	type: Phaser.WEBGL,
	parent: 'game',
	backgroundColor: '#351f1b',
	scale: {
		mode: Phaser.Scale.NONE,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		height: window.innerHeight,
		width: window.innerWidth,
	},
	physics: {
		default: "arcade",
		arcade: {
			debug: false,
		},
	},
	render: {
		antialiasGL: false,
		pixelArt: true,
	},
	callbacks: {
		postBoot: windowSizeChanged
	},
	canvasStyle: `display: block; width: 100%; height: 100%;`,
	autoFocus: true,
	audio: {
		disableWebAudio: false,
	},
	scene: [NewWorld],
};

function windowSizeChanged() {
	if (game.isBooted) {
		setTimeout(() => {
			game.scale.resize(window.innerWidth, window.innerHeight);
			game.canvas.setAttribute(
				'style',
				`display: block; width: ${window.innerWidth}px; height: ${window.innerHeight}px;`,
			);
		}, 100);
	}
};

window.onresize = windowSizeChanged;

let game: Phaser.Game = new Phaser.Game(gameConfig);
