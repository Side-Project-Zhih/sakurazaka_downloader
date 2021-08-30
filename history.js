const fs = require("fs");
const axios = require("axios");
const jsdom = require("jsdom");
const download = require("download");
const inquirer = require("inquirer");
const question = [
  {
    type: "input",
    name: "url",
    message: "網址",
  },
];
(async () => {
  //讀取token
  let setting = await fs.promises.readFile("./setting.json");
  setting = JSON.parse(setting.toString());
  const { token, isRenew } = setting;
  console.log("============================================================\n");
  token === ""
    ? console.log(
        "----warning----請至setting.json輸入你的token----warning---- \n"
      )
    : console.log(`你的Token:${token}\n`);
  console.log("============================================================");

  //input 網址
  const res = await inquirer.prompt(question);
  const PART = 30;
  const index = "https://sakurazaka46.com";
  const url = res.url;
  //讀取網頁
  const data = await axios(url, {
    headers: {
      cookie: `B81AC560F83BFC8C=${token}`,
    },
  });
  //抓取DOM
  const dom = new jsdom.JSDOM(data.data);
  const document = dom.window.document;
  let title = document.querySelector("h3");
  if (!title) {
    title = "抓不到名子，你得自己命名QAQ";
  } else {
    title = title.textContent.trim();
  }
  console.log(title);
  //照片格式處理
  let pic = document.querySelectorAll(".c-thumb-img");
  const path = `./${title}`;
  pic = [...pic].map(
    (item) =>
      index + item.dataset.downloadImagePath.replace("960_960_102400", "")
  );
  //照片分批
  let offset = Math.ceil(pic.length / PART);
  offset = Array(offset).fill(PART);
  const picLength = pic.length - 1;
  let list = offset.map((item, i) => {
    if (i === offset.length - 1) {
      pic.slice(i * item, picLength);
    }
    return pic.slice(i * item, (i + 1) * item);
  });

  console.log(`下載 ${title}中... 請稍候`);

  //分批下載
  let series = list.map((arr, i) => {
    return async () => {
      await Promise.all(
        arr.map(async (pic, j) => {
          await download(pic, path, { filename: `${j + 1 + i * PART}.jpg` });
        })
      );
    };
  });
  const msg = await (async (arr) => {
    for (let aj of arr) {
      await aj();
    }
    return "finished";
  })(series);
  // 完成訊息
  console.log(msg);
})();
