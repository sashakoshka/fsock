"use strict"

module.exports = class FSock {
  #tlsSock
  #buf
  ondata
  onerror

  constructor (tlsSock) {
    this.#tlsSock = tlsSock
    this.#buf     = Buffer.alloc(0)

    this.#tlsSock.on ("data", (packet) => {
      this.#buf = Buffer.concat([this.#buf, packet])

      while (this.#buf.length > 4) {
        // get length, and if we need more data, go back to ask for it
        const len = this.#buf.readUInt32BE(0)
        if (this.#buf.length < packet.length) break

        // extract data and give it to event handler
        const frame = this.#buf.slice(0, len)
        const data  = frame.slice(4)
        this.ondata(data)

        // remove data we read from buffer
        this.#buf = this.#buf.slice(len)
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
}
