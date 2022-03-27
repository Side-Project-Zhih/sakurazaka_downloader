const fs = require("fs");
const mkdirp = require("mkdirp");
const download = require("download");
const axios = require("axios");
const jsdom = require("jsdom");
const inquirer = require("inquirer");
const { questions, memberList } = require("./config/blogConfig");
const { mergePromise, createInitialFolder } = require("./helper/helper");
const blogController = require("./controller/blogController");

//顯示成員編號
const profile = blogController.showMemberInfo(memberList);

(async () => {
  await createInitialFolder("./sakuBlog");
  let page;
  let endPage;
  let setting = await fs.promises.readFile("./setting.json");
  setting = JSON.parse(setting.toString());
  const { renewFistPage, openMany } = setting;
  let members = [];
  if (renewFistPage) {
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
      const pageUrl = blogController.getBlogPageUrls(page, endPage, MEMBER_NUM);
      let pageUrlLog = pageUrl.map((page, i) => {
        return async () => {
          const res = await axios.get(page);
          const dom = new jsdom.JSDOM(res.data);
          const document = dom.window.document;
          const name = document
            .querySelector(".com-hero-title")
            .textContent.split("　公")[0]
            .trim();
          //request 網頁抓取 (blog 的 成員name、link、title、dates
          let blogs = blogController.getBlogsInfo(document);
          await Promise.all(
            blogs.map(async (blog, i) => {
              //個別部落格資料處理
              const { date, link, title } = blog;
              const res = await axios.get(link);
              const dom = new jsdom.JSDOM(res.data);
              const document = dom.window.document;
              //取得blog照片、內容
              const { pics, content } = blogController.getPicsAndContent(
                document,
                ".box-article"
              );
              const path = `./sakuBlog/${name}/${date}`;
              //下載文章
              await fs.promises
                .access(path)
                .then(() => {})
                .catch(async () => {
                  //  建立folder
                  try {
                    await mkdirp(path);
                    // 下載 article
                    await blogController.downloadArticle(
                      path,
                      title,
                      content,
                      date
                    );
                    // 下載 pics
                    await Promise.all(
                      pics.map(async (pic) => {
                        await download(pic, path);
                      })
                    );
                  } catch (err) {
                    console.log(err);
                  }

                  console.log(`${date} ${title} 下載完成`);
                });
            })
          );
          console.log(`page - ${i} 下載完成`);
        };
      });
      // 依照頁數下載;
      await mergePromise(pageUrlLog);
      console.log("=========================================");
      console.log(`${profile[MEMBER_NUM]} download finished`);
      console.log("=========================================");
    };
  });
  //依成員順序下載
  await mergePromise(downloadList);
  console.log("end");
})();
