import { rules } from './webpack.rules.mjs'

export default {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  output: {
    copy: [{ from: 'static', to: 'public' }],
  },
}
