# ectopy README.md

![Editor](https://raw.githubusercontent.com/billroy/ectopy/master/doc/main-window.png "Workspace Overview")


## What is it?

ectopy is a web-based heartbeat visualizer focused on analysis of variability in the duration of beats.

The web interface provides a real-time Poincaré phase chart of successive beats.

The repository includes code to run on an Arduino connected to a pulse sensor,
which provides beat data to the web application.


## Install

    git clone https://github.com/billroy/ectopy.git
    cd ectopy
    npm install
    node ectopy.js

Open a browser on http://localhost:3000

## Command Line Options

### --port=3000

Binds the server to a chosen port.  Default port is 3000.

### --ssl and --certs

Specify --ssl=true and --certs=/path/to/certs to engage ssl.
