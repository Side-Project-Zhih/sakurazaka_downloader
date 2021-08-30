const fs = require("fs");
const https = require("https");

const mkdirp = require("mkdirp");
const download = require("download");
const axios = require("axios");
const jsdom = require("jsdom");
const inquirer = require("inquirer");
const memberList = require("./sakuList.json");
const dectectRepeat = require("./hepler/helper").dectectRepeat;

const INDEX = "https://sakurazaka46.com";
const profile = {};
console.log("--------------成員編號---------------");
console.log("=====================================");

memberList.forEach((member, i) => {
  const key = Object.keys(member)[0];
  profile[`${member[key]}`] = key;
  console.log(member);
});
console.log("===============================================");
console.log("若成員編號為個位數請補上'0'  ex '03' 不要輸入 '3'");
console.log("===============================================");
var questions = [
  {
    type: "input",
    name: "num",
    message: "成員編號:",
  },
  {
    type: "input",
    name: "page",
    message: "頁碼:",
  },
  {
    type: "input",
    name: "endPage",
    message: "最後頁碼:",
  },
];

var another = [
  {
    type: "input",
    name: "page",
    message: "頁碼:",
  },
  {
    type: "input",
    name: "endPage",
    message: "最後頁碼:",
  },
];
// 輪流執行
const mergePromise = async (arr) => {
  for (let aj of arr) {
    await aj();
  }
  return "finished";
};

(async () => {
  let page;
  let endPage;
  let setting = await fs.promises.readFile("./setting.json");
  setting = JSON.parse(setting.toString());
  const { isRenew, openMany } = setting;
  let members = [];
  if (isRenew) {
    page = 1;
    endPage = 1;
    members = setting.sakuMember;
    if (openMany) {
      const res = await inquirer.prompt(another);
      page = +res.page;
      endPage = +res.endPage;
    }
  } else {
    const res = await inquirer.prompt(questions);
    page = +res.page;
    endPage = +res.endPage;
    members.push(res.num);
  }
  --page;
  --endPage;
  const downloadList = members.map((MEMBER_NUM) => {
    return async () => {
      const pageUrl = [];

      for (let i = page; i <= endPage; ++i) {
        pageUrl.push(
          `https://sakurazaka46.com/s/s46/diary/blog/list?&page=${i}&cd=blog&ct=${MEMBER_NUM}`
        );
      }
      let pageUrlLog = pageUrl.map((page, i) => {
        return async () => {
          //request 網頁抓取 name link titles dates
          const res = await axios.get(page);
          // console.log(res)
          const dom = new jsdom.JSDOM(res.data);
          const document = dom.window.document;
          const name = document
            .querySelector(".com-hero-title")
            .textContent.split("　公")[0]
            .trim();
          let blogLinks = document.querySelectorAll(
            ".member-blog-listm .box a"
          );
          if (!blogLinks.length) {
            console.log("無此頁面");
            return;
          }
          let blogTitles = document.querySelectorAll(
            ".member-blog-listm .box .title"
          );
          let blogDates = document.querySelectorAll(
            ".member-blog-listm .box .date"
          );
          //內容處理
          blogLinks = [...blogLinks].map((item) => INDEX + item.href);
          blogTitles = [...blogTitles].map((item) => item.textContent);
          blogDates = [...blogDates].map((item) =>
            item.textContent.split("/").join("-")
          );
          blogDates = dectectRepeat(blogDates);
          //同時下載各個blog

          await Promise.all(
            blogLinks.map(async (link, i) => {
              //個別部落格資料處理
              const res = await axios.get(link);
              const dom = new jsdom.JSDOM(res.data);
              const document = dom.window.document;
              const pics = [];
              const title = blogTitles[i];
              const date = blogDates[i];
              document
                .querySelector(".box-article")
                .querySelectorAll("img")
                .forEach((url) => {
                  let separate = url.src.split("/");
                  const length = separate.length;
                  pics.push(INDEX + url.src);
                  url.src = separate[length - 1];
                });
              const content = document.querySelector(".box-article");
              const path = `./${name}/${date}`;
              //下載文章
              await fs.promises
                .access(path)
                .then(() => {
                  // console.log("blog已下載過");
                })
                .catch(async () => {
                  //  folder = 
                  await mkdirp(path);
                  // article = 
                  await fs.writeFile(
                    `${path}/${title}.html`,
                    `<h1>${title}</h1>` + "<br><br><br>" + content.innerHTML,
                    function (err, result) {
                      if (err) {
                        fs.writeFile(
                          `${path}/${date}.html`,
                          `<h1>${title}</h1>` +
                            "<br><br><br>" +
                            content.innerHTML,
                          function (err, result) {
                            if (err) console.log("文章標題有問題");
                            console.log("文章檔名更改並下載成功");
                          }
                        );
                      }
                    }
                  );

                  // download pics
                  await Promise.all(
                    pics.map(async (pic) => {
                      const downloadPics = await download(pic, path);
                    })
                  );
                  console.log(`${date} ${title} 下載完成`);
                });
            })
          );
          console.log(`page - ${i} 下載完成`);
        };
      });
      // 照頁數下載;
      const msg = await (async (arr) => {
        for (let aj of arr) {
          await aj();
        }
        return "OK";
      })(pageUrlLog);
      console.log("=========================================");
      console.log(`${profile[MEMBER_NUM]} download finished`);
      console.log("=========================================");
    };
  });
  await mergePromise(downloadList);
  console.log("end");
})();
