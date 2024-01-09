const path = require('path');

module.exports = (env, argv) => ({
  mode: argv.mode || 'production',
  devtool: argv.mode === 'development' ? 'source-map' : false,
  entry: {
    content: './src/content.ts',
    background: './src/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-typescript'],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
});
