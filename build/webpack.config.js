const path = require('path');
const webpack = require('webpack');

const getPath = p => path.resolve(__dirname, p);
const isProduction = false;

module.exports = {
  devtool: 'source-map',
  entry: {
    index: getPath('../src/index.es6')
  },
  output: {
    path: `${__dirname}/../dist`,
    publicPath: '/',
    filename: './comm100SDK.js',
    sourceMapFilename: '[file].map',
    library: ['[name]'],
  },
  module: {
    loaders: [
      {
        test: /\.es6?$/,
        exclude: /node_modules/,
        include: getPath('../src/'),
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      }  
      
    ],
  },
  plugins: [
    //new webpack.HotModuleReplacementPlugin()
  ],
  devServer:{
    contentBase: path.join(__dirname, "../dist"),
    port:7000
  }
};
