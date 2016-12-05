# Ectopy README.md


## What is it?

Ectopy is a web-based heartbeat visualizer focused on analysis of variability
in the duration of beats.

The web interface provides a real-time Poincaré phase chart of successive beats.

The repository includes code to run on an Arduino connected to a pulse sensor,
which provides beat data to the web application.

## Disclaimer

This software is intended for personal use and research, and is not intended
for medical purposes or for use as a medical device.

Irregular heartbeat is a serious medical condition.  If you have irregular
heartbeat, contact your physician or call emergency services immediately.

Your attention is called to the disclaimer in the LICENSE file.

## Install

See the file INSTALL.txt for installation and configuration instructions.

## Command Line Options

### --port=3000

Binds the web server to a chosen HTTP port.  Default port is 3000.

### --serialport=/dev/tty.SLAB_TO_UART

Uses the specified serial device instead of auto-searching.

### --baud=115200

Sets the baud rate on the serial port.  Default is 115200.

### --logfile=beats.log

Sets the log file name.
