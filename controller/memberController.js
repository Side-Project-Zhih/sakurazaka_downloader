const mkdirp = require('mkdirp')
const m3u8ToMp4 = require('m3u8-to-mp4')
const converter = new m3u8ToMp4()
const axios = require('axios')
const jsdom = require('jsdom')
const download = require('download')
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
  getManagerAllPage: (start, end) => {
    const urlAll = []
    for (let i = start; i <= end; ++i) {
      urlAll.push(
        `https://sakurazaka46.com/s/s46/diary/managers_diary/list?page=${i}&cd=managers_diary`
      )
    }
    return urlAll
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
  downloadManager: async (lists) => {
    let alreadyDone = true
    await Promise.all(
      [...lists].map(async (list) => {
        let date = list.querySelector('.date').textContent.replace(/[.]/g, '-')
        let pics = list.querySelectorAll('.list-photo img')

        await Promise.all(
          [...pics].map((item) => {
            let src = index + item.src.replace('960_960_102400', '')
            let temp = src.split('/')
            let name = date + '_' + temp[temp.length - 2] + '.jpg'
            return fs.promises
              .access(`./manager/${name}`)
              .then()
              .catch((error) => {
                alreadyDone = false
                download(src, './manager', { filename: `${name}` })
              })
          })
        )
      })
    )
    return alreadyDone
  },
  downloadM3u8: (m3u8Url, path, title) => {
    return converter
      .setInputFile(m3u8Url)
      .setOutputFile(`${path}/${title}.mp4`)
      .start()
      .catch((e) => console.log(e))
  },
  getM3u8: (data) => {
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
  },
  getLoginHeader: (token) => {
    return {
      cookie: `B81AC560F83BFC8C=${token}`,
      'user-agent':
        'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36'
    }
  },
  batchData: (pic, PART, path) => {
    let offset = Math.ceil(pic.length / PART)
    offset = Array(offset).fill(PART)
    const picLength = pic.length - 1
    let list = offset.map((item, i) => {
      if (i === offset.length - 1) {
        pic.slice(i * item, picLength)
      }
      return pic.slice(i * item, (i + 1) * item)
    })
    //分批下載
    let series = list.map((arr, i) => {
      return async () => {
        await Promise.all(
          arr.map(async (pic, j) => {
            await download(pic, path, { filename: `${j + 1 + i * PART}.jpg` })
          })
        )
      }
    })
    return series
  }
}
