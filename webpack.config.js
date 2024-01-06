const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    content: './src/content.ts',
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
};
