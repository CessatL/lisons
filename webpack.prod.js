const path = require("path")
const webpack = require("webpack")
const merge = require("webpack-merge")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const common = require("./webpack.common")

const mode = "production"

const mainConfig = merge(common.mainConfig, {
  mode: mode,
  node: {
    __dirname: false
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new UglifyJsPlugin()
  ]
})

const rendererConfig = merge(common.rendererConfig, {
  mode: mode,
  entry: ["babel-polyfill", common.rendererEntry],
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new HtmlWebpackPlugin({ template: common.htmlTemplatePath }),
    new UglifyJsPlugin()
  ]
})

module.exports = [mainConfig, rendererConfig]
