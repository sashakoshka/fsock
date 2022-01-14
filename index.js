"use strict"

class FrameSock {
  #tlsSock
  #frameSize
  #frameDataSize
  #buf
  onData
  onError

  constructor (tlsSock, frameSize = 512) {
    this.#tlsSock       = tlsSock
    this.#frameSize     = frameSize
    this.#frameDataSize = this.frameSize - 4
    this.#buf           = Buffer.alloc(0)

    if (frameSize < 64 || frameSize > 65535)
      throw `invalid frame size of ${frameSize}, must be in range 64-65535, ` +
            "inclusive. if unsure, use 512."

    this.#tlsSock.on ("data", (packet) => {
      this.#bufAppend(packet)

      while (this.#buf.length >= this.frameSize) {
        const frame = this.#bufTop()
        const code  = frame.readUInt16BE(0)
        const len   = frame.readUInt16BE(2)

        if (len > this.frameDataSize) {
          this.#error (
            `received frame data overflow: ${len} ` +
            `==X=> ${this.frameDataSize}`
          )
          return
        }
        
        const data = frame.slice(4, len + 4)
        this.onData(code, data)

        this.#bufPop()
      }
    })
  }

  on (eventName, callback) {
    switch (eventName) {
      case "data":
        // should be in the form of:
        // function (code, data) {}
        this.onData = callback
        break

      case "error":
        this.onError = callback
        this.#tlsSock.on("error", callback)
        break
      
      default:
        this.#tlsSock.on(eventName, callback)
        break
    }
  }

  write (code, buf) {
    if (buf.length > this.frameDataSize)
      throw `frame overflow: ${buf.length} ==X=> ${this.frameDataSize}`

    let newbuf = Buffer.alloc(this.frameSize)
    newbuf.writeUInt16BE(code, 0)       // frame code (dev defined)
    newbuf.writeUInt16BE(buf.length, 2) // data size

    buf.copy(newbuf, 4)
    this.#tlsSock.write(newbuf)
  }

  #error (err) {
    if (this.onError)
      this.onError(err)
    else
      throw err
  }

  #bufAppend (data) {
    this.#buf = Buffer.concat([this.#buf, data])
  }

  #bufTop () {
    return this.#buf.slice(0, this.frameSize)
  }

  #bufPop () {
    this.#buf = this.#buf.slice(this.frameSize)
  }

  get frameSize     () {return this.#frameSize}
  get frameDataSize () {return this.#frameDataSize}
}

module.exports = FrameSock
