class TilesetConfiguration {
    constructor(public name: string, public imageAssetPath: string) {

    }

    get imageName() {
        return `${this.name}_image`;
    }
}

class TilemapConfiguration {
    constructor(public name: string,
        public configJSONPath: string,
        public tilesets: TilesetConfiguration[],
        public layers: TileLayerConfiguration[]) {

    }
}

class TileLayerConfiguration {
    constructor(public name: string) {

    }
}


export default class NewWorld extends Phaser.Scene {
    constructor(public controls: Phaser.Cameras.Controls.SmoothedKeyControl,
        public tilemapConfig: TilemapConfiguration) {
        super('Welcome to Web Colonization');
    }

    preload() {
        const tilelayerConfig = new TileLayerConfiguration("BaseTerrain")
        const tilesetConfig = new TilesetConfiguration("fantasytileset",
            'assets/tiles/fantasyhextiles_v3.png')

        this.tilemapConfig = new TilemapConfiguration(
            "hexagon-tilemap",
            'assets/tiles/hexagon-tilemap.json',
            [tilesetConfig],
            [tilelayerConfig]
        )
        this.load.image(tilesetConfig.imageName, tilesetConfig.imageAssetPath);
        this.load.tilemapTiledJSON(this.tilemapConfig.name, this.tilemapConfig.configJSONPath);

    }

    configureControls() {
        const cursors = this.input.keyboard!.createCursorKeys();

        const controlConfig = {
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            acceleration: 0.02,
            drag: 0.0005,
            maxSpeed: 0.7
        };

        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig)!;
    }

    create() {
        const tilemap = this.add.tilemap(this.tilemapConfig.name);
        const tileset: Phaser.Tilemaps.Tileset = tilemap.addTilesetImage(this.tilemapConfig.tilesets[0].name,
            this.tilemapConfig.tilesets[0].imageName)!;
        const layer: Phaser.Tilemaps.TilemapLayer = tilemap.createLayer(this.tilemapConfig.layers[0].name, 
            tileset)!;

        this.configureControls();

        this.cameras.main.setZoom(3);
        this.cameras.main.centerOn(0, 0);
    }

    update(time: number, delta: number) {
        this.controls.update(delta)
    }
}
