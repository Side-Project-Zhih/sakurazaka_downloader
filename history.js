const fs = require('fs')
const axios = require('axios')
const jsdom = require('jsdom')
const download = require('download')
const inquirer = require('inquirer')
const memberController = require('./controller/memberController')
const { historyQuestion } = require('./config/memberConfig')
const { mergePromise } = require('./helper/helper')
;(async () => {
  //讀取token
  let setting = await fs.promises.readFile('./setting.json')
  setting = JSON.parse(setting.toString())
  const { token } = setting
  //確認是否有輸入token
  memberController.checkToken(token)

  //input 網址
  const res = await inquirer.prompt(historyQuestion)
  const PART = 30
  const index = 'https://sakurazaka46.com'
  const url = res.url
  //讀取網頁
  const data = await axios(url, {
    headers: memberController.getLoginHeader(token)
  })
  //抓取DOM
  const dom = new jsdom.JSDOM(data.data)
  const document = dom.window.document
  let title = document.querySelector('h3')
  if (!title) {
    title = '抓不到名子，你得自己命名QAQ'
  } else {
    title = title.textContent.trim()
  }
  console.log(title)
  //照片格式處理
  let pic = document.querySelectorAll('.thumb-img')
  const path = `./${title}`
  pic = [...pic].map(
    (item) =>
      index + item.dataset.downloadImagePath.replace('960_960_102400', '')
  )
  //照片分批 and 分批下載
  let series = memberController.batchData(pic, PART, path)
  console.log(`下載 ${title}中... 請稍候`)
  const msg = await mergePromise(series)
  // 完成訊息
  console.log(msg)
})()
