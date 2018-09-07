const Order = require('./order')
// const FileData = require('./filedata')
const path = require('path')

// new Order([
//   {
//     name: '-c',
//     cb: function(params){

//     }
//   },
//   {
//     name: '-w',
//     cb: function(){}
//   },
//   {
//     name: '-l',
//     cb: function(){}
//   },
//   {
//     name: '-s',
//     cb: function(){}
//   },
//   {
//     name: '-a',
//     cb: function(){}
//   },
//   {
//     name: '',
//     cb: function(){}
//   },
// ])

// var argv = process.argv.slice(2)
// console.log(argv)
// console.log(path.join(__dirname, 'D:/Users/LZF/Desktop/study/ruangong'))


/**
 * -c file.c     //返回文件 file.c 的字符数
 * -w file.c    //返回文件 file.c 的词的数目  
 * -l file.c      //返回文件 file.c 的行数
 * -s   递归处理目录下符合条件的文件。
 * -a   返回更复杂的数据（代码行 / 空行 / 注释行）。
 * [file_name]: 文件或目录名，可以处理一般通配符
 */