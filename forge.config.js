const devContentSecurityPolicy = `

default-src 'self' 'unsafe-inline' data:
script-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:
worker-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:
img-src 'self' mine: file: data:
connect-src 'self' mine: file: ws: https:
`.split('\n').filter(l => l.length).join('; ')

module.exports = {
  packagerConfig: {
    icon: 'stuff/icon'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        devContentSecurityPolicy,
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
  ],
}
