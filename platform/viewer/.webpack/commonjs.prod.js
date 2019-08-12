const path = require('path');
const merge = require('webpack-merge');
const webpackCommon = require('./../../../.webpack/webpack.common.js');
const pkg = require('./../package.json');
// const
const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    // https://webpack.js.org/configuration/mode/#mode-production
    mode: 'production',
    devtool: 'source-map',
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      warnings: true,
    },
    optimization: {
      minimize: true,
      sideEffects: true,
    },
    output: {
      path: ROOT_DIR,
      library: 'ohifViewer',
      libraryTarget: 'umd',
      filename: pkg.main,
    },
    /**
     * For CommonJS, we want to bundle whatever font we've landed on. This allows
     * us to reduce the number of script-tags we need to specify for simple use.
     *
     * PWA will grab these externally to reduce bundle size (think code split),
     * and cache the grab using service-worker.
     */
    module: {
      rules: [
        {
          test: /\.(ttf|eot|woff|woff2)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
              },
            },
          ],
        },
      ],
    },
  });
};
