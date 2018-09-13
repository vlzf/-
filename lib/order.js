function order(callback){
  let params = process.argv.slice(2), 
      length = params.length, 
      read = [], output = [], url = []
  for(let i = 0; i < length; i++){
    let value = params[i]
    switch(value) {
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