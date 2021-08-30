const fs = require('fs')
const mkdirp = require('mkdirp')
module.exports = {
  mergePromise: async (arr) => {
    for (let aj of arr) {
      await aj()
    }
    return 'finished'
  },
  createInitialFolder: (path) => {
    return fs.promises.access(path).catch(() => mkdirp(path))
  }
}
