const axios = require('axios')
const jsdom = require('jsdom')
const download = require('download')
const inquirer = require('inquirer')
const fs = require('fs')
const memberController = require('./controller/memberController')
const { pageQuestions } = require('./config/memberConfig')
const { mergePromise, createInitialFolder } = require('./helper/helper')
;(async () => {
  let start
  let end
  // 讀取token
  let setting = await fs.promises.readFile('./config/setting.json')
  setting = JSON.parse(setting.toString())
  const { token, renewFistPage } = setting

  //確認是否有輸入token
  memberController.checkToken(token)
  //建立初始資料夾
  await createInitialFolder('./manager')
  //判斷是否使用更新最新
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
  // 建立欲造訪頁面
  const urlAll = memberController.getManagerAllPage(start, end)
  const path = './manager'
  let fileNames = await fs.promises.readdir(path)
  //一頁頁request
  let pages = urlAll.map((url, i) => {
    return async () => {
      const res = await axios(url, {
        headers: memberController.getLoginHeader(token)
      })
      const dom = new jsdom.JSDOM(res.data)
      const document = dom.window.document
      let lists = document.querySelectorAll('.list')
      const alreadyDone = await memberController.downloadManager(lists)
      if (alreadyDone) {
        console.log('已更新到最新')
      } else {
        console.log(`正在下載 ....${i} `)
      }
    }
  })
  const msg = await mergePromise(pages)
  console.log(msg)
})()
