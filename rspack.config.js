const path = require("path");

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  entry: {
    index: "./src/index.js"
  },
  output: {
    path: path.resolve(__dirname),
    filename: "file-clerk.min.js",
    publicPath: "/"
  },
  resolve: {
    alias: {
      "localforage-esm": require.resolve("localforage")
    }
  },
  devServer: {
    static: {
      directory: __dirname
    },
    port: 8000,
    open: false
  }
};
