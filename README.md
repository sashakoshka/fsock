# fsock

Simple socket framing module for HLHV.

## How to use

First, you need to require the module

`npm install @hlhv/fsock`

```
// *.js
const FSock = require("@hlhv/fsock")
```

Within a NodeJS tcp, tls, etc. server or client connection, create a new FSock
object and pass through the socket you want to set up framing in, and a frame
size. Both server and client must use the same frame size, this is important!
Also, the frame size must be in the range of 64 - 65535, inclusive.

It is important to set the data and error events of the FSock *after* you create
it, because the data functions from the original sock will not carry over.

And that's it! You now have a very minimal setup for frames inside of a tcp
connection. It will go both ways - both sending and recieving are handled
through the `write` method and the `data` event (as long as both server and
client have set up an FSock object around their respective socket objects). If
you want some more detailed info about what this is or how it works, take a look
at the source code. It's only one file, around 78 lines long.
