const fs = require('fs')
const path = require('path')

/**
 * -c file.c     //返回文件 file.c 的字符数
 * -w file.c    //返回文件 file.c 的词的数目  
 * -l file.c      //返回文件 file.c 的行数
 * -s   递归处理目录下符合条件的文件。
 * -a   返回更复杂的数据（代码行 / 空行 / 注释行）。
 * [file_name]: 文件或目录名，可以处理一般通配符
 */

class FileData {
  constructor(url, data) {
    let array = url.replace(/\//g, '\\').split('\\')
    this.uid = ++FileData.uid
    this.url = url
    this.name = array[array.length-1]
    this.dir = --array.length && array.join('\\')
    this.message = []
    this.handler(data)
  }

  handler(data){
    if(typeof data !== 'string') return
    let t = this
    switch(FileData.order) {
      case '-c': 
    }
  }

  charCount(string){
    let count = string.length
    this.message.push({
      name: '字符数',
      text: count
    })
    return count
  }

  wordCount(string){
    let oldCount = string.length,
        string1 = string.replace(/[\u4e00-\u9fa5]/g, ''), // 减去汉字
        newCount = string1.length,
        zhWordCount = oldCount - newCount, // 求差，得中文词数
        string2 = string1.replace(/~[a-zA-Z\n]/g,' ').replace(/( ){1,}/g,' ').replace(/^( )|( )$/g, ''), // 留下英文和缩减无用空格符
        enWordCount = string2.split(' ').length, // 以空格分离，获取数组长度，即得英文词数
        wordCount = zhWordCount + enWordCount

    this.message.push({
      name: '词数',
      text: wordCount
    })

    return wordCount
  }

  rowCount(string){
    let rowCount = string.length - string.replace(/\n/g, '').length
    this.message.push({
      name: '行数',
      text: rowCount
    })
    return rowCount
  }

  
}

FileData.quene = []
FileData.uid = 0
FileData.order = ''

FileData.readUrl = async function(url, { before = function(){}, after = function(){} }) { // 读文件入口
  before()
  try {
    if(typeof url === 'string') {
      let isExist = await FileData.isExist(url)
      url = isExist ? url : path.join(__dirname, url)
      await FileData.urlHandler(url)
    } else if(url instanceof Array) {
      await FileData.readFileArray(url)
    } 
    await FileData.readFileQuene()
  } catch (e) {
    throw(e)
  }
  after()
}

FileData.readFileQuene = async function() {
  let quene = FileData.quene
  let i = quene.length
  while(i--){
    let url = quene[i]
    await FileData._readFile(url)
  }
}

FileData.readFileArray = async function (array){ // 读取文件数组
  let i = array.length
  try {
    while(i--){
      let url = array[i]
      let isExist = await FileData.isExist(url)
      url = isExist ? url : path.join(__dirname, url)
      await FileData.urlHandler(url)
    }
  } catch(e){
    throw(e)
  }
}

FileData.urlHandler = async function(url) { // 判断文件和文件夹
  let stats = await FileData._lstat(url)
  if(stats.isDirectory()){ // 为文件夹
    FileData._readdir(url)
  } else { // 为文件
    FileData.quene.push(url)
  }
}

FileData._readFile = function (url) { // 读单个文件
  return new Promise((resolve, reject)=>{
    fs.readFile(url, 'utf-8', (err, data)=>{
      if(err) {
        throw err
      }
      FileData.wordCount(url, data)
      resolve(true)
    })
  })
}

FileData._readdir = function (url) { // 读取文件目录
  return new Promise((resolve, reject)=>{
    fs.readdir(url, (err, data)=>{
      if(err){
        throw err
      }
      let map = data.map((e, i)=>{
        return path.join(url, e)
      })
      resolve(FileData.readFileArray(map))
    })
  })
}

FileData.wordCount = function(url, data){ // 统计文件字符
  return new FileData(url, data)
}

FileData._lstat = function(url) { // 读取路径信息
  return new Promise((resolve, reject)=>{
    fs.lstat(url, (err, stats)=>{
      if(err){
        throw err
      }
      resolve(stats)
    })
  })
}

FileData.isExist = function(url){ // 判断路径存在
  return new Promise((resolve)=>{
    fs.exists(url, (exists)=>{
      resolve(exists)
    })
  })
}



// readFile(__dirname)


module.exports = FileData

