"use strict"

module.exports = class FSock {
  #tlsSock
  #buf
  ondata
  onerror

  constructor (tlsSock) {
    this.#tlsSock       = tlsSock
    this.#buf           = Buffer.alloc(0)

    this.#tlsSock.on ("data", (packet) => {
      this.#bufAppend(packet)

      while (this.#buf.length > 4) {
        const len = this.#buf.readUInt32BE(0)
        if (this.#buf.length < packet.length) break
        
        const frame = this.#bufTop(len)
        const data = frame.slice(4)
        this.ondata(data)

        this.#bufPop(len)
      }
    })
  }

  /* on (eventName, callback)
     assigns an event handler callback to an event name. if the event name is
     not data or error, it is directly assigned to the underlying socket. */
  on (eventName, callback) {
    switch (eventName) {
      case "data":  this.ondata  = callback; break
      case "error": this.onerror = callback
      default:      this.#tlsSock.on(eventName, callback)
    }
  }

  /* write (...fragments)
     takes in any number of Buffer objects and sends them in a single frame */
  write (...fragments) {
    let outgoing = Buffer.concat([Buffer.alloc(4), ...fragments])
    outgoing.writeUInt32BE(outgoing.length, 0)
    this.#tlsSock.write(outgoing)
  }

  #error (err) {
    if (this.onerror)
      this.onerror(err)
    else
      throw err
  }

  #bufAppend (data) {this.#buf = Buffer.concat([this.#buf, data])}
  #bufPop    (len)  {this.#buf = this.#buf.slice(len)}
  #bufTop    (len)  {return this.#buf.slice(0, len)}
}
