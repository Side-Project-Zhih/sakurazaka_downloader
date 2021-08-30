module.exports = {
  mergePromise: async (arr) => {
    for (let aj of arr) {
      await aj()
    }
    return 'finished'
  },
}
