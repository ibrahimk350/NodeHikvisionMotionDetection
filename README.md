# Node Hikvision Motion Detection
This repo is for Hikvision Camera's in-built motion detection and sending alerts to ZoneMinder.

### Features
- Uses Hikvision in-built motion detection and sends alert to zoneminder to start/stop recording.
- The in-built motion detection is definitely much better to use and takes the load off the zoneminder server.
- Can be registered as a service to run the background and start/stop automatically with the system.
- Comes with a script which will actively monitor the service.

### Requirements
- Zoneminder: 1.36.10
- Nodejs: v17.0.1
- npm: 8.1.2
- Apache: Apache/2.4.41
- MySQL: 8.0.27
- Ubuntu: 20.04

### Installation
- Please follow the [Wiki](https://github.com/ibrahimk350/NodeHikvisionMotionDetection/wiki) for step-by-step installation instructions.

### Note
- Special thanks to [nayrnet & ragingcomputer](https://github.com/nayrnet/node-hikvision-api) - Who wrote the hikvision class. I just brought it up to speed and made it work with ZoneMinder by debugging my way through it.

### Contributors
- Ibrahim Khalid
