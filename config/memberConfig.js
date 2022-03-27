module.exports = {
  pageQuestions: [
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
  ],
  historyQuestion: [
    {
      type: "input",
      name: "year",
      message: "年份",
    },
  ],
  askAccount: [
    {
      type: "input",
      name: "email",
      message: "輸入帳號",
    },
    {
      type: "input",
      name: "password",
      message: "輸入密碼",
    },
  ],
  videoHeaders: {
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
  },
  api: "https://edge.api.brightcove.com/playback/v1/accounts/4504957038001/videos/",
  index: "https://sakurazaka46.com",
};
