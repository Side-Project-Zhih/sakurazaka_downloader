const m3u8ToMp4 = require("m3u8-to-mp4");
const axios = require("axios");
const jsdom = require("jsdom");
const mkdirp = require("mkdirp");
const download = require("download");
const fs = require("graceful-fs");
const inquirer = require("inquirer");
const converter = new m3u8ToMp4();

const api =
  "https://edge.api.brightcove.com/playback/v1/accounts/4504957038001/videos/";
const data = [];
const pageUrl = [];
const index = "https://sakurazaka46.com";

let questions = [
  {
    type: "input",
    name: "start",
    message: "start:",
  },
  {
    type: "input",
    name: "end",
    message: "end:",
  },
];

(async function () {
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
  //headers 設定
  const videoHeaders = {
    Host: "edge.api.brightcove.com",
    Connection: "keep-alive",
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
    "sec-ch-ua":
      '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
    Accept:
      "application/json;pk=BCpkADawqM1s3YJCo5m-oxoijLRhK5Y90LWZr1Pfz9i9f-nhiSKPmFHzfwQcCpkTKlb4fd4gJsviDFh1jnsHZ5tKMKaELAJc5YHXPP84bSpQEXAGbkJT9HVj4B_fgQGVRyP05Z8CqfhzbePw",
    "sec-ch-ua-mobile": "?1",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Mobile Safari/537.36",
    Origin: "https://sakurazaka46.com",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    Referer: "https://sakurazaka46.com/",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-TW,zh;q=0.9,ja;q=0.8,en-US;q=0.7,en;q=0.6",
  };
  const pageHeaders = {
    cookie: `B81AC560F83BFC8C=${token}`,
    "user-agent":
      " Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Mobile Safari/537.36",
  };
  //設定是否只更新第一頁
  let start, end;
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
  //初始建立資料夾
  await fs.promises.access("./sakumimi").catch(() => mkdirp("./sakumimi"));
  let filenames = await fs.promises.readdir("./sakumimi");
  //確定資料夾內檔案名稱
  let existFile = "";
  existFile = filenames
    .filter((item) => item.includes("Sakumimi_vol_"))
    .map((item) => +item.split("_")[2].split("-")[0])
    .sort((a, b) => b - a);

  for (let i = start; i <= end; ++i) {
    pageUrl.push(
      `https://sakurazaka46.com/s/s46/diary/radio/list?ima=1254&page=${i}&cd=radio`
    );
  }
  let notDownload = [];
  // 確認未下載部分
  await Promise.all(
    pageUrl.map(async (url) => {
      const res = await axios.get(url, { headers: pageHeaders });
      const dom = new jsdom.JSDOM(res.data);
      const document = dom.window.document;
      [...document.querySelectorAll(".box-txt")].map((item) => {
        let num = +item.querySelector(".ttl").textContent.split("#")[1];
        if (!existFile.includes(num)) {
          let link = item.querySelector("a").href;
          notDownload.push(index + link);
        }
      });
    })
  );
  // 判斷是否已更新至最新
  if (notDownload.length !== 0) {
    //抓去個別radio 的 照片、名稱、videoId、內容
    await Promise.all(
      notDownload.map(async (link) => {
        const res = await axios.get(link, { headers: pageHeaders });
        const dom = new jsdom.JSDOM(res.data);
        const document = dom.window.document;
        const id = document.querySelector("video").dataset.videoId;
        let title = document.querySelectorAll(".tag_keyamimi a");
        title = [...title]
          .map((item) => item.textContent.replace("#", ""))
          .join("_");
        let pic =
          index +
          document
            .querySelector(".video img")
            .src.replace("500_1080_102400", "");
        pic = pic.replace("500_1080_102400", "");
        const innerContent = document
          .querySelector(".caption")
          .textContent.trim();
        data.push({ title, cover: pic, videoId: id, content: innerContent });
      })
    );
    //整理並下載
    await Promise.all(
      data.map(async (radio) => {
        let { title, videoId, cover, content } = radio;
        const videoUrl = api + videoId;
        const res = await axios.get(videoUrl, { headers: videoHeaders });
        // const m3u8Url = res.data.sources;
        // m3u8Url =
        let m3u8Url = res.data.sources.find((item) => {
          return item.src && item.src.includes("m3u8");
        }).src;
        title = `${res.data.name}-${title}`;
        const path = `./sakumimi/${title}`;
        await mkdirp(path);
        console.log(title + "-folder OK");
        await fs.promises.writeFile(`${path}/${title}.txt`, content);
        await download(cover, path, { filename: `${title}.jpg` });
        console.log(title + "-cover OK");

        await converter
          .setInputFile(m3u8Url)
          .setOutputFile(`${path}/${title}.mp4`)
          .start()
          .catch((e) => console.log(e));
        console.log(title + "File converted");
      })
    );

    return console.log("finished");
  }
  return console.log("已更新到最新");
})();
