const fs = require('fs')
const axios = require('axios')
const jsdom = require('jsdom')
const download = require('download')
const inquirer = require('inquirer')
const memberController = require('./controller/memberController')
const { historyQuestion } = require('./config/memberConfig')
const { mergePromise } = require('./helper/helper')
const { createInitialFolder } = require('./controller/memberController')
;(async () => {
  //讀取token
  let setting = await fs.promises.readFile('./setting.json')
  setting = JSON.parse(setting.toString())
  let { password, email, token  } =
    await memberController.checkAccount(setting)
  //input 年分
  const res = await inquirer.prompt(historyQuestion)
  const PART = 30
  const index = 'https://sakurazaka46.com'
  const year = res.year
  //確認是否有輸入token
  await memberController.testAndRenewToken(token, email, password, setting)

  // 抓取年份網頁
  const path = `./history/${year}`
  await createInitialFolder(path)
  let url = `https://sakurazaka46.com/s/s46/page/history_${year}?page=0`

  //讀取年分網頁
  const data = await axios(url, {
    headers: memberController.getLoginHeader(token)
  })
  // 抓取所有相簿名稱
  const dom = new jsdom.JSDOM(data.data)
  const document = dom.window.document
  let books = document.querySelectorAll('.box')
  let record = await memberController.readOrCreateRecordForHistory(
    'historyRecord.json',
    year
  )
  let unDownload = {}
  books = [...books]
  for (let book of books) {
    let title = book.querySelector('h3').textContent.trim()
    let bookUrl = index + book.querySelector('a').href
    if (!record[year][title]) {
      unDownload[title] = bookUrl
    } else if (record[year][title].length !== 0) {
      try {
        await fs.promises.access(`./history/${year}/${title}`)
      } catch (err) {
        if (err) {
          let pic = record[year][title]
          const path = `./history/${year}/${title}`
          let series = memberController.batchData(pic, PART, path)
          console.log(`下載 ${title}中... 請稍候`)
          await mergePromise(series)
        }
      }
    }
  }
  if (!Object.keys(unDownload).length) {
    console.log('都更新完啦')
  } else {
    for (let title in unDownload) {
      let url = unDownload[title]
      let page = await axios(url, {
        headers: memberController.getLoginHeader(token)
      })
      const dom = new jsdom.JSDOM(page.data)
      const document = dom.window.document
      let pic = document.querySelectorAll('.thumb-img')
      const path = `./history/${year}/${title}`
      pic = [...pic].map(
        (item) =>
          index + item.dataset.downloadImagePath.replace('960_960_102400', '')
      )
      record[year][title] = pic
      await fs.promises.writeFile(
        './historyRecord.json',
        JSON.stringify(record)
      )
      let series = memberController.batchData(pic, PART, path)
      console.log(`下載 ${title}中... 請稍候`)
      await mergePromise(series)
      console.log(`${title} 下載完成`)
    }
    console.log('finished')
  }
})()
