module.exports = {
  chainWebpack(config) {
    config.externals([/^https?$/, 'url'])
  }
}
