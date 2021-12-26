# 爬蟲:櫻坂46成員部落格及會元內容備份
可以備份
1. 成員部落格含相片及內文
2. 會員內容的history相簿
3. 會員內容的manager's diary的相片
4. 會員內容的sakumimi的廣播含介紹、影音、封面

# 環境建置與需求
```
"node.js": "v10.15.0" -執行環境  
"axios": "^0.21.1" -發出請求
"download": "^8.0.0" -下載圖片
"jsdom": "^16.6.0" -本文轉換DOM元素
"m3u8-to-mp4": "^1.0.0" -下載m3u8檔(影片)
"mkdirp": "^1.0.4" -建立資料夾
```
# 安裝

### 下載 exe檔

[blog](https://github.com/Side-Project-Zhih/sakurazaka_downloader/raw/master/exe/blog.exe) / [manager](https://github.com/Side-Project-Zhih/sakurazaka_downloader/raw/master/exe/manager.exe) / [sakumimi](https://github.com/Side-Project-Zhih/sakurazaka_downloader/raw/master/exe/sakumimi.exe) / [history](https://github.com/Side-Project-Zhih/sakurazaka_downloader/raw/master/exe/history.exe)

### 下載專案
git clone https://github.com/Side-Project-Zhih/sakurazaka_downloader.git  
or
右上方 "code" 下載

### 安裝套件
```
npm install
```
### 建立setting.json  
需要含以下內容

```
{
 //sakumember放入成員編號，請務必加上 ""，ex "08"
 sakumember:[],
 //cookie Number
 token:"",
 //是否只更新第一頁，預設為false
 renewFistPage:"false",
 //多名成員狀況下，是否開啟多頁下載
 openMany:false
}

```
# 使用

## 部落格
1. 執行程式

````
npm run blog  
````

2. 依照終端機顯示的清單填寫編號  
<br>![成員編號](https://i.imgur.com/xtehoQq.png)<br>
3. 頁數範圍  
<br>![頁數範圍](https://i.imgur.com/As7aoOY.png)<br>
4. 下載至 "./sakublog"  
<br>![blog呈現](https://i.imgur.com/RLXIzJb.png)<br>
 資料夾分層
<br>![detail](https://i.imgur.com/tBf6l4w.png)<br>

## 會員內容  

### manager  

1. 執行程式

````
npm run manager  
````
2. 頁數範圍  
<br>![](https://i.imgur.com/eJYn2pB.png)
<br>
3. 下載至 "./manager"  
<br>![](https://i.imgur.com/DWZ0TAI.png)

### history
1. 執行程式

````
npm run history  
````
2. 複製history相簿網址
```
https://sakurazaka46.com/s/s46/contents_list?ima=4722&cd=104&ct=fc_photo_031&so=ID  
```

![](https://i.imgur.com/r9j6lWH.png)

3. 依照終端機顯示的清單填寫網址 
<br> 
![](https://i.imgur.com/JMXsDwe.png)
<br>
4. 下載至 "./${相簿名稱}"  
<br>
![](https://i.imgur.com/lb8KkMW.png)
<br>

###sakumimi(廣播)
1. 執行程式

````
npm run mimi  
````
2. 確定頁數範圍  

觀察網址，page=1 代表第2頁，如果要寫選擇1~3頁，填1和3即可，程式內會自動幫你轉換
```
https://sakurazaka46.com/s/s46/diary/radio/list?page=1&cd=radio
```
![](https://i.imgur.com/Y7v8JRR.png)

3. 頁數範圍  
<br>![](https://i.imgur.com/eJYn2pB.png)  
<br>
4. 下載至 "./sakumimi"
<br>![廣播](https://i.imgur.com/0VvlPOT.png)

# 功能
### blog
可下載指定成員Blog並依成員姓名及Blog傳寫日期分類
+ 單人下載模式: 可下載指定成員及指定頁面
<br>
+ 多人下載模式:
  需將 setting.json中的**renewFistPage 更改為 true**，並在 sakumember填寫欲下載的成員編號  
  + 預設 會下載sakumember內的成員的部落格，但只會更新第一頁   
  ```
  {
      "sakuMember": 
      ["06",  "11", "21"],
      "token": "your cookie",
      "renewFistPage": true,
      "openMany": false
  }
  ```
  

  + 預下載 sakumember內的成員的部落格 複數的頁數，需將 setting.json中的**renewFistPage 改為true、openMany改為 true**  
  ```
  {
      "sakuMember": 
      ["06",  "11", "21"],
      "token": "your cookie",
      "renewFistPage": true,
      "openMany": true
  }
  ```
### mamager
+ 可下載指定頁面的manager's diary的相片， 並依日期排序
+ setting.json中的renewFistPage 為 true 的情況下只會更新第一頁

### history
+ 可下載指定頁面的history的相片，並已相簿名稱命名  

### sakumimi(廣播)
+ 可下載指定頁面的sakumimi，並依期號下載簡介、音檔、封面
+ setting.json中的renewFistPage 為 true 的情況下只會更新第一頁

# 如何抓取個人cookie(請妥善保管)  
**cookie帶有個人敏感資訊，請勿洩漏!** 每次登入會重新發放一組新的號碼
+  登入會員
1. 按下F12按下Application
2. 選取cookie => `http://sakurazaka46.com`
3. 搜尋 B81AC560F83BFC8C  (會有兩個請挑httpOnly那個)
4. 複製 指定value(有httponly的那個) 貼到 setting.json的token內

![](https://i.imgur.com/a9Kv3pc.png)