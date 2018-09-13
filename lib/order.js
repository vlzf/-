function order(callback){
  let params = process.argv.slice(2), // 拿到控制台输入的命令
      length = params.length, 
      read = [], output = [], url = []
  for(let i = 0; i < length; i++){
    let value = params[i]
    switch(value) { // 命令分类
      case '-c': output.push(value);break
      case '-w': output.push(value);break
      case '-l': output.push(value);break
      case '-a': output.push(value);break
      case '-s': read.push(value);break
      default: url.push(value); break
    }
  }
  callback(url, read, output)
}

module.exports = order