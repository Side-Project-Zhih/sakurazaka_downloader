const axios = require("axios");
const jsdom = require("jsdom");
const mkdirp = require("mkdirp");
const download = require("download");
const fs = require("graceful-fs");
const inquirer = require("inquirer");
const {
  index,
  api,
  pageQuestions,
  videoHeaders,
} = require("./config/memberConfig");
const { createInitialFolder } = require("./helper/helper");
const memberController = require("./controller/memberController");
(async function () {
  //讀取token
  let setting = await fs.promises.readFile("./setting.json");
  setting = JSON.parse(setting.toString());
  let { password, email, token, renewFistPage } =
    await memberController.checkAccount(setting);
  //設定是否只更新第一頁
  let start, end;
  if (renewFistPage) {
    start = 1;
    end = 1;
  } else {
    const res = await inquirer.prompt(pageQuestions);
    start = res.start;
    end = res.end;
  }
  --start;
  --end;
  //確認是否有輸入token
  token = await memberController.getTokenByReq(setting);
  //初始建立資料夾
  await createInitialFolder("./sakumimi");

  let record = await memberController.readOrCreateRecordForMimi(
    "mimiRecord.json",
    "./sakumimi"
  );

  //確定資料夾內檔案名稱
  const pageUrl = memberController.getRadioAllPage(start, end);
  let pageHeaders = memberController.getLoginHeader(token);
  // 確認未下載部分
  let notDownload = await memberController.notDownloadRadio(
    pageUrl,
    record,
    pageHeaders
  );

  // 判斷是否已更新至最新
  if (!notDownload.length) {
    console.log("已更新到最新");
  } else {
    //抓去個別radio 的 照片、名稱、videoId、內容
    await Promise.all(
      notDownload.map(async (obj) => {
        for (let episode in obj) {
          let link = obj[episode];
          const res = await axios.get(link, { headers: pageHeaders });
          const dom = new jsdom.JSDOM(res.data);
          const document = dom.window.document;
          const id = document.querySelector("video").dataset.videoId;
          let title = document.querySelectorAll(".tag_keyamimi a");
          title = [...title]
            .map((item) => item.textContent.replace("#", ""))
            .join("_");
          let cover =
            index +
            document
              .querySelector(".video img")
              .src.replace("500_1080_102400", "");
          cover = cover.replace("500_1080_102400", "");
          const content = document.querySelector(".caption").textContent.trim();
          const videoUrl = api + id;
          record[episode] = {
            title,
            cover,
            url: videoUrl,
            content,
          };

          const videoRes = await axios.get(videoUrl, { headers: videoHeaders });
          let m3u8Url = memberController.getM3u8(videoRes.data);

          title = `${episode}-${title}`;
          const path = `./sakumimi/${title}`;

          //建立個別資料夾=> 下載簡介 => 下載圖片 => 下載音檔
          await mkdirp(path);
          console.log(title + "-folder OK");
          await fs.promises.writeFile(`${path}/${title}.txt`, content);
          await download(cover, path, { filename: `${title}.jpg` });
          console.log(title + "-cover OK");
          await memberController.downloadM3u8(m3u8Url, path, title);
          console.log(title + "File converted");
        }
      })
    );
  }
  await fs.promises.writeFile("./mimiRecord.json", JSON.stringify(record));
  console.log("finished");
})();
