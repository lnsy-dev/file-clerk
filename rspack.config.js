const path = require("path");

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  entry: {
    index: "./src/index.js"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/dist/"
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
