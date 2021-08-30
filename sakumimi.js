const axios = require('axios')
const jsdom = require('jsdom')
const mkdirp = require('mkdirp')
const download = require('download')
const fs = require('graceful-fs')
const inquirer = require('inquirer')
const {
  index,
  api,
  pageQuestions,
  videoHeaders
} = require('./config/memberConfig')
const memberController = require('./controller/memberController')
const data = []
;(async function () {
  //讀取token
  let setting = await fs.promises.readFile('./config/setting.json')
  setting = JSON.parse(setting.toString())
  const { token, renewFistPage } = setting

  //確認是否有輸入token
  memberController.checkToken(token)
  //headers 設定
  const pageHeaders = {
    cookie: `B81AC560F83BFC8C=${token}`,
    'user-agent':
      ' Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Mobile Safari/537.36'
  }
  //設定是否只更新第一頁
  let start, end
  if (renewFistPage) {
    start = 1
    end = 1
  } else {
    const res = await inquirer.prompt(pageQuestions)
    start = res.start
    end = res.end
  }
  --start
  --end
  //初始建立資料夾
  await memberController.createInitialFolder('./sakumimi')
  let filenames = await fs.promises.readdir('./sakumimi')
  //確定資料夾內檔案名稱
  let existFile = memberController.checkFolderFileNames(filenames)
  const pageUrl = memberController.getRadioAllPage(start, end)

  // 確認未下載部分
  let notDownload = await memberController.notDownloadRadio(
    pageUrl,
    existFile,
    pageHeaders
  )

  // 判斷是否已更新至最新
  if (notDownload.length !== 0) {
    //抓去個別radio 的 照片、名稱、videoId、內容
    await Promise.all(
      notDownload.map(async (link) => {
        const res = await axios.get(link, { headers: pageHeaders })
        const dom = new jsdom.JSDOM(res.data)
        const document = dom.window.document
        const id = document.querySelector('video').dataset.videoId
        let title = document.querySelectorAll('.tag_keyamimi a')
        title = [...title]
          .map((item) => item.textContent.replace('#', ''))
          .join('_')
        let pic =
          index +
          document
            .querySelector('.video img')
            .src.replace('500_1080_102400', '')
        pic = pic.replace('500_1080_102400', '')
        const innerContent = document
          .querySelector('.caption')
          .textContent.trim()
        data.push({ title, cover: pic, videoId: id, content: innerContent })
      })
    )
    //整理並下載
    await Promise.all(
      data.map(async (radio) => {
        let { title, videoId, cover, content } = radio
        const videoUrl = api + videoId
        const res = await axios.get(videoUrl, { headers: videoHeaders })
        let m3u8Url = memberController.getM3u8(res.data)
        title = `${res.data.name}-${title}`
        const path = `./sakumimi/${title}`
        //建立個別資料夾=> 下載簡介 => 下載圖片 => 下載音檔
        await mkdirp(path)
        console.log(title + '-folder OK')
        await fs.promises.writeFile(`${path}/${title}.txt`, content)
        await download(cover, path, { filename: `${title}.jpg` })
        console.log(title + '-cover OK')
        await memberController.downloadM3u8(m3u8Url, path, title)
        console.log(title + 'File converted')
      })
    )
    return console.log('finished')
  }
  return console.log('已更新到最新')
})()
