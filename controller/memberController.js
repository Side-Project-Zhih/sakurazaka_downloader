const mkdirp = require('mkdirp')
const m3u8ToMp4 = require('m3u8-to-mp4')
const converter = new m3u8ToMp4()
const axios = require('axios')
const jsdom = require('jsdom')
const fs = require('fs')
//===== config =====
const index = 'https://sakurazaka46.com'

//===================

module.exports = {
  createInitialFolder: (path) => {
    return fs.promises.access(path).catch(() => mkdirp(path))
  },
  checkFolderFileNames: (filenames) => {
    return filenames
      .filter((item) => item.includes('Sakumimi_vol_'))
      .map((item) => +item.split('_')[2].split('-')[0])
      .sort((a, b) => b - a)
  },
  getRadioAllPage: (start, end) => {
    const pageUrl = []
    for (let i = start; i <= end; ++i) {
      pageUrl.push(
        `https://sakurazaka46.com/s/s46/diary/radio/list?ima=1254&page=${i}&cd=radio`
      )
    }
    return pageUrl
  },
  notDownloadRadio: async (pageUrl, existFile, pageHeaders) => {
    let notDownload = []
    await Promise.all(
      pageUrl.map(async (url) => {
        const res = await axios.get(url, { headers: pageHeaders })
        const dom = new jsdom.JSDOM(res.data)
        const document = dom.window.document
        ;[...document.querySelectorAll('.box-txt')].map((item) => {
          let num = +item.querySelector('.ttl').textContent.split('#')[1]
          if (!existFile.includes(num)) {
            let link = item.querySelector('a').href
            notDownload.push(index + link)
          }
        })
      })
    )
    return notDownload
  },
  downloadM3u8: (m3u8Url, path, title) => {
    return converter
      .setInputFile(m3u8Url)
      .setOutputFile(`${path}/${title}.mp4`)
      .start()
      .catch((e) => console.log(e))
  },
  getM3u8: (data) =>{
    return data.sources.find((item) => {
      return item.src && item.src.includes('m3u8')
    }).src
  },
  checkToken: (token) => {
      console.log('=========================================================\n')
      token === ''
        ? console.log(
            '----warning----請至setting.json輸入你的token----warning---- \n'
          )
        : console.log(`你的Token:${token}\n`)
      console.log('===========================================================')
  }
}
