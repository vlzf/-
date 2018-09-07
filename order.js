class Order { // 指令类
  constructor(opts){ // 传入配置 [{name: Array, cb: Function} , ...]
    let originArgvs = process.argv.slice(2), // 获取参数
        [orderName, ...params] =  originArgvs // 获取指令和参数
    opts = Order.$mergeOptions(opts) // 合并配置
    Order.$setFunction.call(this, opts) // 绑定函数
    Order.$emit.call(this, orderName, params)
  }
}

Order.$option = [] // 全局配置

Order.$mergeOptions = function(opts){ // 合并配置
  return Order.$option.concat(opts)
}

Order.$setOption = function(opts){ // 更改全局配置
  Order.$option = Order.mergeOptions(opts)
}

Order.$setFunction = function(opts){ // 绑定响应函数
  let i = opts.length
  while(i--){
    let obj = opts[i], 
        name = obj.name,
        cb = obj.cb
    if(typeof cb !== 'function') continue
    if(typeof name === 'string'){
      this[name] = cb
    } else if(name instanceof Array) {
      let j = name.length
      while(j--){
        this[name[j]] = cb
      }
    }
  }
}

Order.$emit = function(orderName, params){ // 发射响应函数
  this[orderName]
    ?this[orderName](params)
    :function(){
      console.log('指令不存在')
    }
}

module.exports = Order