const fs = require('fs')
const download = require('download')
const INDEX = 'https://sakurazaka46.com'

module.exports = {
  showMemberInfo: (memberList) => {
    const profile = {}
    console.log('--------------成員編號---------------')
    console.log('=====================================')

    memberList.forEach((member, i) => {
      const key = Object.keys(member)[0]
      profile[`${member[key]}`] = key
      console.log(member)
    })
    console.log('===============================================')
    console.log("若成員編號為個位數請補上'0'  ex '03' 不要輸入 '3'")
    console.log('===============================================')
    return profile
  },
  getBlogPageUrls: (page, endPage, MEMBER_NUM) => {
    const pageUrl = []
    for (let i = page; i <= endPage; ++i) {
      pageUrl.push(
        `https://sakurazaka46.com/s/s46/diary/blog/list?&page=${i}&cd=blog&ct=${MEMBER_NUM}`
      )
    }
    return pageUrl
  },
  getBlogsInfo: function (document) {
    let blogs = document.querySelectorAll('.member-blog-listm .box')
    blogs = [...blogs].map((blog) => {
      let link = blog.querySelector('a')
      let title = blog.querySelector('.title')
      let date = blog.querySelector('.date')
      link = INDEX + link.href
      title = title.textContent
      date = date.textContent.split('/').join('-')
      return {
        link,
        title,
        date
      }
    })
    return this.dectectRepeat(blogs)
  },
  dectectRepeat: (blogs) => {
    const hashDate = {}
    const len = blogs.length
    for (let i = len - 1; i >= 0; --i) {
      if (hashDate[blogs[i].date]) {
        ++hashDate[blogs[i].date]
        blogs[i].date = blogs[i].date + '-' + hashDate[blogs[i].date]
      } else {
        hashDate[blogs[i].date] = 1
      }
    }
    return blogs
  },
  getPicsAndContent: (document, attr) => {
    const content = document.querySelector(attr)
    const pics = []
    content.querySelectorAll('img').forEach((url) => {
      let separate = url.src.split('/')
      const length = separate.length
      pics.push(INDEX + url.src)
      url.src = separate[length - 1]
    })
    return { pics, content }
  },
  downloadArticle: (path, title, content, date) => {
    return fs.promises
      .writeFile(
        `${path}/${title}.html`,
        `<h1>${title}</h1>` + '<br><br><br>' + content.innerHTML
      )
      .catch(() => {
        console.log('文章標題有問題')
        fs.promises
          .writeFile(
            `${path}/${date}.html`,
            `<h1>${title}</h1>` + '<br><br><br>' + content.innerHTML
          )
          .then(function (err, result) {
            console.log('文章檔名更改並下載成功')
          })
      })
  },
}
