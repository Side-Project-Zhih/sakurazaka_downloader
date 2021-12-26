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
  let setting = await fs.promises.readFile('./setting.json')
  setting = JSON.parse(setting.toString())
  let { password, email, token, renewFistPage } = setting
  if (!password || !email) {
    const info = require('dotenv').config().parsed
    password = info.password
    email = info.email
  }

  //判斷是否使用更新最新
  if (renewFistPage) {
    start = 1
    end = 1
  } else {
    const res = await inquirer.prompt(pageQuestions)
    start = res.start
    end = res.end
  }
  //確認是否有輸入token
  await memberController.testAndRenewToken(token, email, password, setting)
  //建立初始資料夾
  await createInitialFolder('./manager')
  --start
  --end
  const path = './manager'
  let fileNames = await memberController.readOrCreateRecord(
    'managerRecord.json',
    path
  )
  // 建立欲造訪頁面
  const urlAll = memberController.getManagerAllPage(start, end)
  //一頁頁request
  let pages = urlAll.map((url, i) => {
    return async () => {
      let unDownload = await memberController.outputUndownloadAtManager(
        url,
        token,
        fileNames
      )
      if (!unDownload.length) {
        console.log('已更新到最新')
      } else {
        console.log(`正在下載 ....${i} `)
        await Promise.all(
          unDownload.map(async (item, j) => {
            await download(item.src, path, { filename: `${item.name}` }).then(
              () => (fileNames[item.name] = item.src)
            )
          })
        )
      }
    }
  })
  const msg = await mergePromise(pages)
  await fs.promises.writeFile('./managerRecord.json', JSON.stringify(fileNames))
  console.log(msg)
})()
