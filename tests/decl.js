"use strict"

const net   = require("net"),
      fs    = require("fs"),
      FSock = require("../index")

let originalData = Buffer.alloc(0),
    amtSent = 0,
    amtGot  = 0

{ // set up server
  let total = Buffer.alloc(0)

  const server = net.createServer ((sock) => {
    serverLog("(i) client connected")

    let fsock = new FSock(sock)
    
    fsock.on ("error", (err) => {
      serverLog ("ERR socket", err)
    })

    fsock.on ("data", (chunk) => {
      amtGot++
    
      let code
      if (chunk.length > 0)
        code = chunk.readUInt8(0)
      else
        serverLog ("ERR got empty data")
      
      chunk = chunk.slice(1)
      if (code === 1) {
        //serverLog(total)
        serverLog(`(i) original length: ${originalData.length} in ${amtSent}`)
        serverLog(`(i) recieved length: ${total.length} in ${amtGot}`)
        if (originalData.compare(total) === 0) {
          serverLog(".// test passed, data are equal")
          process.exit(0)
        } else {
          serverLog("XXX test failed, data are unequal")
          process.exit(1)
        }
      } else {
        serverLog ("(i) got code:", code, "size:", chunk.length)
        total = Buffer.concat([total, chunk])
        serverLog (chunk.toString())
      }
    })
  })

  server.on ("error", (err) => {
    serverLog ("ERR server", err)
  })

  server.listen(4096)
  serverLog("(i) server is listening on port 4096")

  function serverLog (...message) {
    console.log("\x1B[34m" + message.join(' ') + "\x1B[39m")
  }
}

{ // set up client
  const client = net.createConnection ({
    port: 4096
  }, () =>{
    clientLog("(i) connected to server")
    let fsock = new FSock(client)
  
    const loremStream = fs.createReadStream (
      "decl-data",
      {highWaterMark: 512}
    )

    loremStream.on ("data", (chunk) => {
      amtSent++
      
      fsock.write(Buffer.from([0]), chunk)
      originalData = Buffer.concat([originalData, chunk])
      clientLog("... sent", chunk.length, "bytes", `(${chunk.length + 5})`)
    })

    loremStream.on ("error", (err) => {
      clientLog("ERR filestream", err)
    })

    loremStream.on ("end", () => {
      amtSent++
      
      fsock.write(Buffer.from([1]))
      clientLog(".// sent end signal")
      //clientLog(originalText)
    })
  })

  client.on ("error", (err) => {
    serverLog ("ERR client", err)
  })
  
  function clientLog (...message) {
    console.log("\x1B[33m" + message.join(' ') + "\x1B[39m")
  }
}

function addCode (code, data) {
  return Buffer.concat([Buffer.from([code]), data])
}
