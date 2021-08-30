const axios = require("axios");
const jsdom = require("jsdom");
const download = require("download");
const inquirer = require("inquirer");
const mkdirp = require("mkdirp");
const dectectRepeat = require("./hepler/helper").dectectRepeat;
const fs = require("fs");

const timeout = (time) => {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  });
};

(async () => {
  let start;
  let end;
  const urlAll = [];
  const PART = 5;
  let questions = [
    {
      type: "input",
      name: "start",
      message: "頁碼:",
    },
    {
      type: "input",
      name: "end",
      message: "最後頁碼:",
    },
  ];
  // 讀取token
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
  //判斷manager是否存在
  await fs.promises.access("./manager").catch(() => mkdirp("./manager"));

  //判斷是否使用更新最新
  if (isRenew) {
    start = 1;
    end = 1;
  } else {
    const res = await inquirer.prompt(questions);
    start = res.start;
    end = res.end;
  }
  --start;
  --end;
  // 建立欲造訪頁面
  for (let i = start; i <= end; ++i) {
    urlAll.push(
      `https://sakurazaka46.com/s/s46/diary/managers_diary/list?page=${i}&cd=managers_diary`
    );
  }
  const path = "./manager";
  let fileNames = await fs.promises.readdir(path);
  //一頁頁request
  let pages = urlAll.map((url, i) => {
    return async () => {
      let unDownload = [];
      const res = await axios(url, {
        headers: {
          cookie: `B81AC560F83BFC8C=${token}`,
          "user-agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36",
        },
      });
      const dom = new jsdom.JSDOM(res.data);
      const document = dom.window.document;
      const index = "https://sakurazaka46.com";
      let lists = document.querySelectorAll(".list");

      lists = [...lists].map((list) => {
        let date = list.querySelector(".date").textContent.replace(/[.]/g, "-");
        let pics = list.querySelectorAll(".list-photo img");
        pics = [...pics].map((item) => {
          let src = index + item.src.replace("960_960_102400", "");
          let temp = src.split("/");
          let name = date + "_" + temp[temp.length - 2] + ".jpg";
          unDownload.push({ name, src });
        });
      });
      list = null;

      unDownload = unDownload.filter((item) => {
        let { src, name } = item;
        return !fileNames.includes(name);
      });

      if (!unDownload.length) {
        console.log("已更新到最新");
      } else {
        console.log(`正在下載 ....${i} `);
        await Promise.all(
          unDownload.map(async (item, j) => {
            await download(item.src, path, { filename: `${item.name}` });
          })
        );
      }
    };
  });
  const msg = await (async (arr) => {
    for (let item of arr) {
      await item();
    }
    return "finished";
  })(pages);
  console.log(msg);
})();
