const order = require('./lib/order')
const FileData = require('./lib/filedata')
// FileData.readUrl(__dirname, { outOrder: '-c', readOrder: '-s' })
// FileData.readUrl('./main.js', { outOrder: ['-c', '-w'], readOrder: [] })
// FileData.readUrl(__dirname, { outOrder: ['-c', '-w'], readOrder: [] })

order(function(url, read, output){
  url = url.length ? url :[__dirname]
  FileData.readUrl(url, { outOrder: output, readOrder: read })
})

/**
 * -c file.c     //返回文件 file.c 的字符数
 * -w file.c    //返回文件 file.c 的词的数目  
 * -l file.c      //返回文件 file.c 的行数
 * -s   递归处理目录下符合条件的文件。
 * -a   返回更复杂的数据（代码行 / 空行 / 注释行）。
 * [file_name]: 文件或目录名，可以处理一般通配符
 */