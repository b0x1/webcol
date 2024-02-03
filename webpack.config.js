// webpack.config.js
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/app.ts',
    output: {
        filename: 'game.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    optimization: {
        minimize: false
    },
};
