"use strict"

const net   = require("net"),
      fs    = require("fs"),
      FSock = require("../index")

const frameSize = 512

{ // set up server
  let total = ""

  const server = net.createServer ((sock) => {
    serverLog("(i) client connected")

    let fsock = new FSock(sock, frameSize)
    
    fsock.on ("error", (err) => {
      serverLog ("ERR socket", err)
    })

    fsock.on ("data", (code, chunk) => {
      if (code === 1) {
        serverLog(total)
      } else {
        serverLog ("(i) got code:", code, "size:", chunk.length)
        total += chunk.toString()
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
    let fsock = new FSock(client, frameSize)
  
    const loremStream = fs.createReadStream (
      "decl-data",
      {highWaterMark: fsock.frameDataSize}
    )

    loremStream.on ("data", (chunk) => {
      fsock.write(0, chunk)
      clientLog("... sent", chunk.length, "bytes", `(${chunk.length + 4})`)
    })

    loremStream.on ("error", (err) => {
      clientLog("ERR filestream", err)
    })

    loremStream.on ("end", () => {
      fsock.write(1, Buffer.alloc(0))
      clientLog(".// sent end signal")
    })
  })

  client.on ("error", (err) => {
    serverLog ("ERR client", err)
  })
  
  function clientLog (...message) {
    console.log("\x1B[33m" + message.join(' ') + "\x1B[39m")
  }
}
