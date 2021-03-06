"use strict"

module.exports = class FSock {
  #buf
  tlsSock
  ondata
  onerror

  constructor (tlsSock) {
    this.tlsSock = tlsSock
    this.#buf    = Buffer.alloc(0)

    this.tlsSock.on ("data", (packet) => {
      this.#buf = Buffer.concat([this.#buf, packet])

      while (this.#buf.length > 4) {
        // get length, and if we need more data, go back to ask for it
        const len = this.#buf.readUInt32BE(0)
        if (this.#buf.length < packet.length) break

        // extract data, give it to event handler, and remove it from buffer
        this.ondata && this.ondata(this.#buf.slice(4, len + 4))
        this.#buf = this.#buf.slice(len + 4)
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
      default:      this.tlsSock.removeAllListeners(eventName)
                    this.tlsSock.on(eventName, callback)
                    
    }
  }

  /* write (...fragments)
     takes in any number of Buffer objects and sends them in a single frame */
  write (...fragments) {
    let outgoing = Buffer.concat([Buffer.alloc(4), ...fragments])
    outgoing.writeUInt32BE(outgoing.length - 4, 0)
    this.tlsSock.write(outgoing)
  }

  /* destroy ()
     closes the connection */
  destroy () { this.tlsSock.destroy() }

  #error (err) {
    if (this.onerror)
      this.onerror(err)
    else
      throw err
  }
}
