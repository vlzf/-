# 软工作业（一）： WC 程序

- [github 项目地址：https://github.com/vlzf/ruangong.git](https://github.com/vlzf/ruangong.git)  
- CODE: `Node.js` / `Javascript`

***

## 一、项目要求
wc.exe 是一个常见的工具，它能统计文本文件的字符数、单词数和行数。这个项目要求写一个命令行程序，模仿已有wc.exe 的功能，并加以扩充，给出某程序设计语言源文件的字符数、单词数和行数。
实现一个统计程序，它能正确统计程序文件中的字符数、单词数、行数，以及还具备其他扩展功能，并能够快速地处理多个文件。
具体功能要求：

- 程序处理用户需求的模式为： 
```text
wc.exe [parameter] [file_name]
```

- 基本功能列表：（完成）
```text
wc.exe -c file.c     //返回文件 file.c 的字符数
wc.exe -w file.c    //返回文件 file.c 的词的数目  
wc.exe -l file.c      //返回文件 file.c 的行数
```

- 扩展功能：（完成）
```text
-s   递归处理目录下符合条件的文件。
-a   返回更复杂的数据（代码行 / 空行 / 注释行）。
```

- 空行：本行全部是空格或格式控制字符，如果包括代码，则只有不超过一个可显示的字符，例如“{”。
- 代码行：本行包括多于一个字符的代码。
- 注释行：本行不是代码行，并且本行包括注释。一个有趣的例子是有些程序员会在单字符后面加注释：
```text
} //注释
```
在这种情况下，这一行属于注释行。

- `[file_name]`： 文件或目录名，可以处理一般通配符。需求举例：
```text
wc.exe -s -a *.c
```
返回当前目录及子目录中所有*.c 文件的代码行数、空行数、注释行数。

高级功能：（未完成）
- -x 参数。这个参数单独使用。如果命令行有这个参数，则程序会显示图形界面，用户可以通过界面选取单个文件，程序就会显示文件的字符数、行数等全部统计信息。

***

## 二、设计说明

### 设计主要思路
1. 读取命令行输入的命令：
    - 命令以数组方式存储

2. 命令分类：
    - "-c / -w / -l / -a" 为输出数据命令；
    - "-s" 为寻找文件命令，可用通配符匹配；
    - 其它均为文件路径，路径以数组方式存储。

3. 判断是否有 "-s" 命令：
    - 有，启用创建正则表达式。
    - 没有，跳过。

4. 读取路径数组：
    - 处理输入的文件路径名。

5. 判断路径的存在性：
    - 不存在，警告。
    - 存在，执行下一步。

6. 判断路径为文件夹或是单文件：
    - 文件夹，读取里面的文件目录，形成路径数组。转第 4 步。
    - 单文件，将其路径名存入全局文件待读队列（即，路径收集）。

7. 用创建的正则表达式对全局文件待读队列进行筛选：
    - 有 "-s" 命令，筛选。
    - 没有 "-s" 命令，跳过。

8. 对全局文件待读队列存储的文件进行数据读取：
    - 成功，执行下一步。
    - 失败，警告。

9. 处理读取出来的文件数据：
    - 根据输出数据的命令（"-c / -w / -l / -a"）分别处理。处理完所有输出数据命令后再操作台输出结果，结束。


10. 补充：处理输入的文件路径名：
    - 由于输入的文件路径可能是相对路径，也可能是绝对路径。要统一转化成绝对路径。

***

### 关键代码

#### 入口文件：wc.js
```js
const order = require('./lib/order')
const FileData = require('./lib/filedata')
order(function(url, read, output){
  FileData.readUrl(url, { outOrder: output, readOrder: read })
})
```
该文件引入了 `order` 函数和 `FileData` 类。在 `order` 函数的回调函数中调用了 `FileData` 类的静态方法 `readUrl`。

***

#### 命令分类函数所在的文件：order.js
```js
function order(callback){
  let params = process.argv.slice(2), // 拿到控制台输入的命令
      length = params.length, 
      allOrder = false
      read = [], output = [], url = []
  for(let i = 0; i < length; i++){
    let value = params[i]
    switch(value) { // 命令分类
      case '-c': output.push(value);break
      case '-w': output.push(value);break
      case '-l': output.push(value);break
      case '-a': output.push(value);break
      case '-s': read.push(value);break
      case '-all': allOrder = true; break
      default: url.push(value); break
    }
  }
  allOrder && (output = ['-c', '-w', 'l', '-a'])
  callback(url, read, output)
}

module.exports = order
```

***

#### 处理文件的函数在 filedata.js 下：
```js
class FileData {
  constructor(url, data) {
    let array = url.replace(/\//g, '\\').split('\\')
    this.url = url // 完整路径
    this.name = array[array.length-1] // 文件名
    this.dir = --array.length && array.join('\\') // 文件所在目录
    this.message = [] // 需要输出的信息
    this.handler(data) // 选择性处理信息
  }

  handler(data){ // 选择性处理数据
    if(typeof data !== 'string') return
    let t = this
    FileData.outOrder.forEach((e)=>{
      switch(e) { // 选择处理方式
        case '-c': this.charCount(data);break
        case '-w': this.wordCount(data);break
        case '-l': this.rowCount(data);break
        case '-a': this.rowComplexCount(data);break
      }
    })
    this.output() // 输出信息
  }

  charCount(string){ // 计算字符数
    let count = string.replace(/\s/g,'').length
    this.message.push({
      name: '字符数',
      text: count
    })
    return count
  }

  wordCount(string){ // 计算词数
    let wordCount = 0

    string.replace(
      /(\b[a-zA-Z0-9_]+\b)|[\u4e00-\u9fa5]/g,
      e => { 
        wordCount++
        return e 
      }
    ) // 匹配单词边界

    this.message.push({
      name: '词数',
      text: wordCount
    })

    return wordCount
  }

  rowCount(string){ // 计算行数
    let rowCount = string.length - string.replace(/\n/g, '').length + (string.length?1:0)
    this.message.push({
      name: '行数',
      text: rowCount
    })
    return rowCount
  }

  rowComplexCount(string){ // 计算空行/注释行/代码行
    string += '\n'
    let emptyRow = 0,
        explainRow = 0,
        codeRow = 0,

        length = string.length,
        i = 0, // 当前字符位置
        j = -1, // 当行注释符位置

        lastChat = '', // 上一个字符
        chat = '', // 当前字符
        target = '', // 表示处于字符串状态或者注释状态，用于判断 "/* + */" 等情况是字符串还是代码
        targetList = ['`', `'`, `"`, `/*`, `*/`, `//`, '\n'], // 影响注释行判断的字符
        rowChats = '' // 当行字符串

    while(i < length){
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
        if(rowChats.replace(/\s/g, '').length < 2) {
          ++emptyRow //空行
        }
        else if(target === targetList[0]) {
          ++codeRow // 代码行
        }
        else if(target === targetList[3] || rowChats.replace(/(\s)/g, '') === '*/') {
          ++explainRow // 注释行
        }
        else {
          if(j === -1){
            ++codeRow // 代码行
          } else {
            let string1 = rowChats.slice(0, j).replace(/\s/g, ''),
                string2 = rowChats.slice(j).replace(/\s/g, '')
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

  output(){ // 控制塔输出信息
    let message = this.message
    console.log(`\n- 路径：${this.dir}`)
    console.log(`- 文件名：${this.name}`)
    this.message.forEach((e)=>{
      console.log(`- ${e.name}：${e.text}`)
    })
  }
}
```
这里定义了一个 `FileData` 类，其实例方法方法有：
- `handler`: 选择性处理数据。
- `charCount`: 计算字符数，命令 "-c"。
- `wordCount`: 计算词数，命令 "-w"。
- `rowCount`: 计算行数，命令 "-l"。
- `rowComplexCount`: 计算空行/注释行/代码行，命令 "-a"。
- `output`: 控制塔输出信息。

静态属性：
```js
FileData.queue = [] // 单文件待读队列
FileData.outOrder = [] // 输出命令队列
FileData.readOrder = [] // 读取命令队列
FileData.regExp = [] // 正则表达式队列
```

静态方法：
- 读取路径信息入口
```js
FileData.readUrl = async function(url, 
{ 
  before = function(){}, 
  after = function(){}, 
  outOrder = [], 
  readOrder = [] 
}) {
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
    await FileData.readFileQueue()
  } catch (e) {
    throw e
  }
  
  console.log(`\n- 运行时间：${(new Date() - start) / 1000} s`)
  after()
}
```

- 读取路径数组：
```js
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
```

- 判断路径是文件夹还是单文件：
```js
FileData.urlHandler = async function(url) { // 判断文件和文件夹
  try {
    let stats = await FileData._lstat(url)
    if(stats.isDirectory()){ // 为文件夹
      if(!FileData.hasOrder(FileData.readOrder, '-s')) {
        FileData.warn(`${url.split('\\').pop()} 是非文件`)
        return
      }
      let map = await FileData._readdir(url)
      await FileData.readFileArray(map)
    } else { // 为单文件
      FileData.queue.push(url)
    }  
  } catch (e) {
    throw e
  }
}
```

- 生成正则表达式：
```js
FileData.makeRegExp = function(string) {
  reg = []
  if(typeof string === 'string'){
    string = [string]
  } 
  if(string instanceof Array) {
    let i = string.length
    while(i--){
      let v = string[i].replace(/(\\|\/)/g, '\\\\')
              .replace(/\*/g, '[\\s\\S]*')
              .replace(/\?/g, '[\\s\\S]?')
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
```

- 当需要处理 '-s' 命令时，读取不含通配符的路径，缩小寻找范围：
```js
FileData.getBaseUrl = async function(url){
  let baseUrl = path.resolve(__dirname, '../'),
      array = url.replace(/\//g, '\\').split('\\'),
      length = array.length,
      i = 0

  for(; i < length; i++) {
    let v = array[i]
    if(/(\*|\?)/.test(v)) break
  }

  baseUrl = path.resolve(baseUrl, array.slice(0, i).join('\\')) 
  
  try {
    if(!(await FileData.isExist(baseUrl))) {
      FileData.warn(`${baseUrl}不存在`)
      return {
        baseUrl: '',
        regExp: ''
      }
    }
    return {
      baseUrl: baseUrl,
      regExp: array.slice(i).join('\\')
    }
  } catch(e){
    throw e
  }
}
```

- 筛选需要读取的文件：
```js
FileData.selectQueue = function(){
  let reg = FileData.regExp
  return FileData.queue = FileData.queue.filter((e1)=>{
    return reg.some((e2)=>{
      return e2.test(e1)
    })
  })
}
```

- 读取待读文件队列：
```js
FileData.readFileQueue = async function() {
  try {
    let queue = FileData.queue
    let i = queue.length
    while(i--){
      let url = queue[i],
          data = await FileData._readFile(url) // 读取单文件数据

      FileData.wordCount(url, data) // 生成 FileData 实例
    } 
  } catch (e) {
    throw e
  } 
}
```

- 生成 FileData 实例：
```js
FileData.wordCount = function(url, data){ // 统计文件字符
  return new FileData(url, data)
}
```

***

## 三、测试
- 单个词测试

![](https://github.com/vlzf/ruangong/raw/master/image/%E5%8D%95%E4%B8%AA%E8%AF%8D%E6%B5%8B%E8%AF%95.png)

- 单字符测试

![](https://github.com/vlzf/ruangong/raw/master/image/%E5%8D%95%E5%AD%97%E7%AC%A6%E6%B5%8B%E8%AF%95.png)

- 空文件测试

![](https://github.com/vlzf/ruangong/raw/master/image/%E7%A9%BA%E6%96%87%E4%BB%B6%E6%B5%8B%E8%AF%95.png)

- 源文件测试

![](https://github.com/vlzf/ruangong/raw/master/image/%E6%BA%90%E6%96%87%E4%BB%B6%E6%B5%8B%E8%AF%95.png)

***

## 四、界面功能
![](https://github.com/vlzf/ruangong/raw/master/image/%E7%95%8C%E9%9D%A2.png)

***

## PSP
| PSP2.1                                  | Personal Software Process Stages        | 预估耗时（分钟） | 实际耗时（分钟） |
|-----------------------------------------|-----------------------------------------|-----------------|------------------|
| Planning                                | 计划                                    |                 |                  |
| · Estimate                              | · 估计这个任务需要多少时间                |      15         |       15         |
| Development                             | 开发                                    |                 |                  |
| · Analysis                              | · 需求分析 (包括学习新技术)              |     60           |       60        |
| · Design Spec                           | · 生成设计文档                          |      120         |      180         |
| · Design Review                         | · 设计复审 (和同事审核设计文档)          |     60           |                  |
| · Coding Standard                       | · 代码规范 (为目前的开发制定合适的规范)   |     30           |                  |
| · Design                                | · 具体设计                              |     180         |                  |
| · Coding                                | · 具体编码                              |     4320        |  2880            |
| · Code Review                           | · 代码复审                              |     120         |                  |
| · Test                                  | · 测试（自我测试，修改代码，提交修改）     |     1440        |                  |
| Reporting                               | 报告                                    |                 |                  |
| · Test Report                           | · 测试报告                              |     120         |                  |
| · Size Measurement                      | · 计算工作量                            |     30          |                  |
| · Postmortem & Process Improvement Plan | · 事后总结, 并提出过程改进计划            |    1440         |                  |
| 合计                                    |                                         |    8935         |                  |

***

## 自我学习进度条
| 第N周    |新增代码（行）| 累计代码（行）| 本周学习耗时(小时) | 累计学习耗时（小时）| 重要成长       |
|---------|-------------|--------------|-------------------|-------------------|----------------|
| 1       |  270        |   270        |     2             |       2           |学会了nodejs开发命令行程序时如何获取控制台传入的参数          |
| 2       |  210  |    400      |       2         |        4           |   栈算法计算注释行      |

***