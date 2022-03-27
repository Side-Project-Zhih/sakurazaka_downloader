const mkdirp = require("mkdirp");
const m3u8ToMp4 = require("m3u8-to-mp4");
const converter = new m3u8ToMp4();
const axios = require("axios");
const jsdom = require("jsdom");
const download = require("download");
const fs = require("fs");
const inquirer = require("inquirer");
const request = require("request");
//===== config =====
const index = "https://sakurazaka46.com";
const memberConfig = require("../config/memberConfig");
//===================

module.exports = {
  createInitialFolder: (path) => {
    return fs.promises.access(path).catch(() => mkdirp(path));
  },
  checkFolderFileNames: (filenames) => {
    return filenames
      .filter((item) => item.includes("Sakumimi_vol_"))
      .map((item) => +item.split("_")[2].split("-")[0])
      .sort((a, b) => b - a);
  },
  getRadioAllPage: (start, end) => {
    const pageUrl = [];
    for (let i = start; i <= end; ++i) {
      pageUrl.push(
        `https://sakurazaka46.com/s/s46/diary/radio/list?ima=1254&page=${i}&cd=radio`
      );
    }
    return pageUrl;
  },

  getManagerAllPage: (start, end) => {
    const urlAll = [];
    for (let i = start; i <= end; ++i) {
      urlAll.push(
        `https://sakurazaka46.com/s/s46/diary/managers_diary/list?page=${i}&cd=managers_diary`
      );
    }
    return urlAll;
  },
  getM3u8: function (data) {
    return data.sources.find((item) => {
      return item.src && item.src.includes("m3u8");
    }).src;
  },
  notDownloadRadio: async function (pageUrl, record, pageHeaders) {
    let notDownload = [];
    await Promise.all(
      pageUrl.map(async (url) => {
        const res = await axios.get(url, { headers: pageHeaders });
        const dom = new jsdom.JSDOM(res.data);
        const document = dom.window.document;
        [...document.querySelectorAll(".box-txt")].map(async (item) => {
          let num = +item.querySelector(".ttl").textContent.split("#")[1];
          if (!record[`Sakumimi_vol_${num}`]) {
            let link = item.querySelector("a").href;
            let obj = {};
            obj[`Sakumimi_vol_${num}`] = index + link;
            notDownload.push(obj);
          } else if (record[`Sakumimi_vol_${num}`]) {
            let { title, url, cover, content } = record[`Sakumimi_vol_${num}`];
            title = `Sakumimi_vol_${num}-${title}`;
            const path = `./sakumimi/${title}`;
            try {
              await fs.promises.access(path);
            } catch (err) {
              await mkdirp(path);
              const videoRes = await axios.get(url, {
                headers: memberConfig.videoHeaders,
              });
              let m3u8Url = this.getM3u8(videoRes.data);
              console.log(title + "-folder OK");
              await fs.promises.writeFile(`${path}/${title}.txt`, content);
              await download(cover, path, {
                filename: `${title}.jpg`,
              });
              console.log(title + "-cover OK");
              await this.downloadM3u8(m3u8Url, path, title);
              console.log(title + "File converted");
            }
          }
        });
      })
    );
    return notDownload;
  },
  downloadManager: async (lists) => {
    let alreadyDone = true;
    await Promise.all(
      [...lists].map(async (list) => {
        let date = list.querySelector(".date").textContent.replace(/[.]/g, "-");
        let pics = list.querySelectorAll(".list-photo img");

        await Promise.all(
          [...pics].map((item) => {
            let src = index + item.src.replace("960_960_102400", "");
            let temp = src.split("/");
            let name = date + "_" + temp[temp.length - 2] + ".jpg";
            return fs.promises
              .access(`./manager/${name}`)
              .then()
              .catch((error) => {
                alreadyDone = false;
                download(src, "./manager", { filename: `${name}` });
              });
          })
        );
      })
    );
    return alreadyDone;
  },
  downloadM3u8: function (m3u8Url, path, title) {
    return converter
      .setInputFile(m3u8Url)
      .setOutputFile(`${path}/${title}.mp4`)
      .start()
      .catch((e) => console.log(e));
  },
  checkToken: (token) => {
    console.log("=========================================================\n");
    token === ""
      ? console.log(
          "----warning----請至setting.json輸入你的token----warning---- \n"
        )
      : console.log(`你的Token:${token}\n`);
    console.log("===========================================================");
  },
  getLoginHeader: function (token) {
    return {
      cookie: `B81AC560F83BFC8C=${token}`,
      "user-agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36",
    };
  },
  batchData: (pic, PART, path) => {
    let offset = Math.ceil(pic.length / PART);
    offset = Array(offset).fill(PART);
    const picLength = pic.length - 1;
    let list = offset.map((item, i) => {
      if (i === offset.length - 1) {
        pic.slice(i * item, picLength);
      }
      return pic.slice(i * item, (i + 1) * item);
    });
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
    return series;
  },
  testAndRenewToken: async function (token, setting) {
    let res = await axios.get(
      "https://sakurazaka46.com/s/s46/diary/managers_diary/list",
      {
        headers: this.getLoginHeader(token),
      }
    );
    const dom = new jsdom.JSDOM(res.data);
    const document = dom.window.document;
    let button = document.querySelector("button");
    if (button && button.textContent === "ログイン") {
      token = await this.getTokenByReq(setting);
      if (!token) {
        throw new Error("沒拿到token!!");
      }
      setting.token = token;
      try {
        await fs.promises.writeFile("setting.json", JSON.stringify(setting));
      } catch (err) {
        throw new Error("更新setting錯誤");
      }
    }
    return token;
  },
  readOrCreateRecordForManager: async function (filename, oldFileDir) {
    let fileNames = {};
    try {
      fileNames = await fs.promises.readFile(`./${filename}`);
      fileNames = JSON.parse(fileNames.toString());
    } catch (err) {
      let files = await fs.promises.readdir(oldFileDir);
      for (let file of files) {
        fileNames[file] = new Date().toLocaleDateString();
      }
      await fs.promises.writeFile(filename, JSON.stringify(fileNames));
    }
    return fileNames;
  },
  readOrCreateRecordForHistory: async function (filename, year) {
    let record = {};
    try {
      record = await fs.promises.readFile(`./${filename}`);
      record = JSON.parse(record.toString());
      if (!record[year]) {
        record[year] = {};
      }
    } catch (err) {
      if (!record[year]) {
        record[year] = {};
      }
    }
    return record;
  },
  readOrCreateRecordForMimi: async function (filename, oldFileDir) {
    let fileNames = {};
    try {
      fileNames = await fs.promises.readFile(`./${filename}`);
      fileNames = JSON.parse(fileNames.toString());
    } catch (err) {
      let files = await fs.promises.readdir(oldFileDir);
      for (let file of files) {
        let name = file.split("-")[0];
        fileNames[name] = new Date().toLocaleDateString();
      }
      await fs.promises.writeFile(filename, JSON.stringify(fileNames));
    }
    return fileNames;
  },
  outputUndownloadAtManager: async function (url, token, fileNames) {
    let pageHeader = {
      headers: this.getLoginHeader(token),
    };
    let unDownload = [];
    const res = await axios(url, pageHeader);

    const dom = new jsdom.JSDOM(res.data);
    const document = dom.window.document;
    const index = "https://sakurazaka46.com";
    let lists = document.querySelectorAll(".list");

    lists = [...lists].map((list) => {
      let date = list.querySelector(".date").textContent.replace(/[.]/g, "-");
      let pics = list.querySelectorAll(".list-photo img");
      pics = [...pics].map(async (item) => {
        let src = index + item.src.replace("960_960_102400", "");
        let temp = src.split("/");
        let name = date + "_" + temp[temp.length - 2] + ".jpg";
        if (!fileNames[name]) {
          unDownload.push({ name, src });
        } else if (fileNames[name]) {
          try {
            await fs.promises.access(`./manager/${name}.jpg`);
          } catch (err) {
            if (err) {
              await download(src, "./manager", { filename: `${name}` });
            }
          }
        }
      });
    });
    return unDownload;
  },
  getToken: async function (setting) {
    //selenium
    //====chrome======
    const { Builder, By } = require("selenium-webdriver");
    let webdriver = require("selenium-webdriver");
    // let Keys = require('selenium-webdriver/lib/input').Key
    const chrome = require("selenium-webdriver/chrome");
    const options = new chrome.Options();
    options.setUserPreferences({
      "profile.default_content_setting_values.notifications": 1,
    });
    options.excludeSwitches("enable-logging");
    options.windowSize({ height: 800, width: 600 });
    let { password, email } = setting;
    const driver = new Builder()
      .withCapabilities(options)
      .forBrowser("chrome")
      .build();
    const web = "https://sakurazaka46.com/s/s46/login?ima=4949"; //填寫你想要前往的網站
    await driver.get(web);
    const email_ele = await driver.findElement(
      By.css("#form > div:nth-child(1) > div > input[type=email]")
    );
    const email_pwd = await driver.findElement(
      By.css(
        "#form > div.form_list.form_list_password > div > input[type=password]"
      )
    );
    email_ele.sendKeys(email);
    email_pwd.sendKeys(password);

    const nextButton = await driver.findElement(By.id("SaveAccount"));
    if (nextButton.isDisplayed()) {
      await nextButton
        .sendKeys(webdriver.Key.ENTER)
        .catch((err) => console.log(err));
      let title = await driver.findElement(By.className("page_titie"));
      let isLogin = await title.getText();
      if (isLogin === "ログイン成功") {
        console.log(isLogin);
        let token = await driver.manage().getCookie("B81AC560F83BFC8C");
        await driver.close();
        return token;
      } else {
        await driver.close();
        console.log("=================================");
        console.error("幹你打錯帳號密碼啦!!!!!再打一次");
        console.log("=================================");
        let res = await inquirer.prompt(memberConfig.askAccount);
        setting.email = res.email;
        setting.password = res.password;
        await fs.promises.writeFile("./setting.json", JSON.stringify(setting));
        return await this.getToken(setting);
      }
    } else {
      throw new Error("登入頁按鈕消失");
    }
  },
  checkAccount: async function (setting) {
    let { password, email } = setting;
    if (!password || !email) {
      let res = await inquirer.prompt(memberConfig.askAccount);
      setting.email = res.email;
      setting.password = res.password;
      await fs.promises.writeFile("./setting.json", JSON.stringify(setting));
    }
    return setting;
  },
  getTokenByReq: async function (setting) {
    function requestPromise(options) {
      return new Promise((res, rej) => {
        request(options, function (err, response) {
          if (err) return rej(err);
          res(response);
        });
      });
    }
    let { password, email } = setting;
    let options = {
      method: "POST",
      url: "https://sakurazaka46.com/s/s46/login",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      form: {
        mode: "LOGIN",
        idpwLgid: email,
        idpwLgpw: password,
      },
    };
    let res = await requestPromise(options);
    let setCookie = res.headers["set-cookie"];
    let count = 0;
    let token;
    for (let cookie of setCookie) {
      if (cookie.includes("B81AC560F83BFC8C")) {
        token = cookie.split(";")[0].split("=")[1];
        ++count;
      }
    }
    if (count === 2) {
      return token;
    } else {
      console.log("=================================");
      console.error("幹你打錯帳號密碼啦!!!!!再打一次!啾咪 <3");
      console.log("=================================");
      let res = await inquirer.prompt(memberConfig.askAccount);
      setting.email = res.email;
      setting.password = res.password;
      await fs.promises.writeFile("./setting.json", JSON.stringify(setting));
      return await this.getTokenByReq(setting);
    }
  },
};
