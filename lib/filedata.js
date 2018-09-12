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
    FileData.outOrder.forEach((e)=>{
      switch(e) {
        case '-c': this.charCount(data);break
        case '-w': this.wordCount(data);break
        case '-l': this.rowCount(data);break
        case '-a': this.rowComplexCount(data);break
      }
    })
    this.output()
  }

  charCount(string){
    let count = string.replace(/( |\n)/g,'').length
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
    let rowCount = string.length - string.replace(/\n/g, '').length + 1
    this.message.push({
      name: '行数',
      text: rowCount
    })
    return rowCount
  }

  rowComplexCount(string){
    // string = string.replace(/  /g, ' ')
    let emptyRow = 0,
        explainRow = 0,
        codeRow = 0,

        length = string.length,
        i = 0, j = -1, 

        lastChat = '',
        chat = '',
        target = '',
        targetList = ['`', `'`, `"`, `/*`, `*/`, `//`, '\n'],
        rowChats = ''

    while(i < length){
      // console.log(i)
      lastChat = chat
      chat = string[i]
      rowChats += chat
      
      if(chat === targetList[0]) {
        if(!target) target = targetList[0]
        else if(target === targetList[0]) target = ''
      } 
      else if(chat === targetList[1]) {
        if(!target) target = targetList[1]
        else if(target === targetList[1]) target = ''
      }
      else if(chat === targetList[2]) {
        if(!target) target = targetList[2]
        else if(target === targetList[2]) target = ''
      }
      else if(lastChat + chat === targetList[3]) {
        if(!target) {
          target = targetList[3]
          j = rowChats.length - 2
        }
      }
      else if(lastChat + chat === targetList[4]) {
        if(target === targetList[3]) target = ''
      }
      else if(lastChat + chat === targetList[5]) {
        if(!target) {
          target = targetList[5]
          j = rowChats.length - 2
        }
      }
      else if(chat === targetList[6]) {
        if(rowChats.replace(/( |\n)/g, '').length < 2) {
          ++emptyRow //空行
        }
        else if(target === targetList[1]) {
          ++codeRow // 代码行
        }
        else if(target === targetList[3]) {
          ++explainRow // 注释行
        }
        else {
          if(j === -1){
            ++codeRow // 代码行
          } else {
            let string1 = rowChats.slice(0, j).replace(/ /g, ''),
                string2 = rowChats.slice(j).replace(/ /g, '')
            if(string1.length < 2 || string1 === targetList[4]) ++explainRow // 注释行
            else ++codeRow // 代码行
          }

          if(target === targetList[5]) target = ''
        }
        
        rowChats = ''
        j = -1
      }
      i++
    }
        
    // string.replace(/ /g, '')
    // .split('\n')
    // .forEach((e)=>{
    //   if(e.length < 2) ++emptyRow
    // })

    

    this.message.push({
      name: '空行',
      text: emptyRow
    }, {
      name: '注释行',
      text: explainRow
    }, {
      name: '代码行',
      text: codeRow
    })
  }

  output(){
    let message = this.message
    console.log(`\n- 路径：${this.dir}`)
    console.log(`- 文件名：${this.name}`)
    this.message.forEach((e)=>{
      console.log(`- ${e.name}：${e.text}`)
    })
  }
}

FileData.queue = []
FileData.uid = 0
FileData.outOrder = []
FileData.readOrder = []
FileData.regExp = []

FileData.readUrl = async function(url, { before = function(){}, after = function(){}, outOrder=[], readOrder=[] }) { // 读文件入口
  before()
  let start = new Date(), orderS = false
  FileData.outOrder = outOrder
  FileData.readOrder = readOrder
  try {
    if(typeof url === 'string') { // 字符串
      url = [url]
    }
    if(FileData.hasOrder(FileData.readOrder, '-s')) {
      url.length = 1
      orderS = true

      let { baseUrl, regExp } = await FileData.getBaseUrl(url[0])
      FileData.makeRegExp(baseUrl + '\\' + regExp)
      
      if(!baseUrl) {
        FileData.warn('无匹配文件')
        return
      }
      url = [baseUrl]
    }
    await FileData.readFileArray(url)
    orderS && FileData.selectQueue()
    // console.log(FileData.queue)
    await FileData.readFileQueue()
  } catch (e) {
    throw e
  }
  
  console.log(`\n- 运行时间：${(new Date() - start) / 1000} s`)
  after()
}

FileData.readFileQueue = async function() {
  try {
    let queue = FileData.queue
    let i = queue.length
    while(i--){
      let url = queue[i]
      await FileData._readFile(url)
    } 
  } catch (e) {
    throw e
  } 
}

FileData.readFileArray = async function (array){ // 读取文件数组
  let i = array.length
  try {
    while(i--){
      let url = array[i]
      url = path.resolve(__dirname, '../', url)
      
      let isExist = await FileData.isExist(url) // 是否存在
      if(isExist) {
        await FileData.urlHandler(url)
      } else {
        FileData.warn(`${url.split('\\').pop()}文件不存在`)
      }
    }
  } catch(e){
    throw(e)
  }
}

FileData.urlHandler = async function(url) { // 判断文件和文件夹
  try {
    let stats = await FileData._lstat(url)
    if(stats.isDirectory()){ // 为文件夹
      if(!FileData.hasOrder(FileData.readOrder, '-s')) {
        FileData.warn(`${url.split('\\').pop()} 是非文件`)
        return
      }
      await FileData._readdir(url)
    } else { // 为文件
      FileData.queue.push(url)
    }  
  } catch (e) {
    throw e
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

FileData.hasOrder = function(list, order){
  return list.some((e)=>{
    return e === order
  })
}

FileData.makeRegExp = function(data) {
  reg = []
  if(typeof data === 'string'){
    data = [data]
  } 
  if(data instanceof Array) {
    let i = data.length
    while(i--){
      let v = data[i].replace(/\\/g, '\\\\').replace(/\*/g, '[\\s\\S]*').replace(/\?/g, '[\\s\\S]?')
      try {
        reg.push(
          new RegExp(v)
        )
      } catch(e){
        throw e
      }
    }
  }
  return FileData.regExp = reg
}

FileData.selectQueue = function(){
  let reg = FileData.regExp
  return FileData.queue = FileData.queue.filter((e1)=>{
    return reg.some((e2)=>{
      return e2.test(e1)
    })
  })
}

FileData.warn = function(text){
  console.log('- ' + text)
}

FileData.getBaseUrl = async function(url){
  let baseUrl = testUrl = path.resolve(__dirname, '../'),
      array = url.split('\\'),
      length = array.length,
      i = 0

  for(; i < length; i++){
    let v = array[i]
    try {
      testUrl = path.resolve(v)
      if(!(await FileData.isExist(testUrl))) break
      baseUrl = testUrl
    } catch(e) {
      break
    }
  }
  return {
    baseUrl: baseUrl,
    regExp: array.slice(i).join('\\')
  }
}

// FileData.arrayHas = function(array, string){
//   array = array instanceof Array ? array : []
//   return new Set(array).has(string)
// }

function test(){
  console.log('test')
}

// readFile(__dirname)


module.exports = FileData

