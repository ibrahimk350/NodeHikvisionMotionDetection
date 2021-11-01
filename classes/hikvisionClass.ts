import net from "net";
import xml2js from "xml2js";
import Events from "events";

/**
 * @class hikvisionClass
 * @description hikvisionClass for detecing motion in Hikvision Cameras
 */
export class hikvisionClass extends Events {
    client: any;
    activeEvents: any = {};
    triggerActive = false;
    ipAddress: string;
    port: number;
    username: string;
    password: string;
    trace = false;
    Parser = xml2js.parseString;

    constructor(
        ipAddress: string,
        port: number,
        username: string,
        password: string
    ) {
        super();
        this.activeEvents = {};
        this.ipAddress = ipAddress;
        this.port = port;
        this.username = username;
        this.password = password;
        this.connect();
    }

    connect(): void {
        // This Reference
        var _self = this;

        // Auth Header
        var authHeader = "Authorization: Basic " + 
            Buffer.from(
                _self.username + 
                ":" + 
                _self.password).toString("base64");
    
        // Connect
        _self.client = net.connect(
            _self.port,
            _self.ipAddress, () => {
            var header: string =
                "GET /ISAPI/Event/notification/alertStream HTTP/1.1\r\n" +
                "Host: " +
                _self.ipAddress +
                ":" +
                _self.port +
                "\r\n" +
                authHeader +
                "\r\n" +
                "Accept: multipart/x-mixed-replace\r\n\r\n";
      
            _self.client.write(header);
            _self.client.setKeepAlive(true, 10000);
            _self.client.setTimeout(30000);
            _self.handleConnection();
        });

        _self.client.on("data", (data: any) => _self.handleData(data));
        _self.client.on("close", () => { _self.handleEnd(); });
        _self.client.on("error", (err: any) => { _self.handleError(err) });
        _self.client.on("end", (err: any) => { _self.handleError(err); });
    }

    // Handle alarms
    handleData(data: any): void {
        var dataToString = data.toString().split("\n");
        var notifStartIndex: number = 0;
        var notifStopIndex: number = 0;
        var buildString: string = "";
        var result: any;
        var _self = this;

        // Loop through each notfication alert
        dataToString.forEach((element: string, index: number) => {
            if (
                element.includes(
                    '<EventNotificationAlert version="2.0" ' +
                    'xmlns="http://www.hikvision.com/ver20/XMLSchema">'
                )
            ) {
                notifStartIndex = index;
            }

            if (
                element.includes(
                    '</EventNotificationAlert>'
                )
            ) {
                notifStopIndex = index;
            }
        });

        // Build the EventNotificationAlert String    
        if (notifStopIndex !== 0) {
            buildString = dataToString.slice(
                notifStartIndex,
                notifStopIndex + 1
            ).join("\n");
        }

        // Parse the buildSting
        _self.Parser(buildString, function(err: any, parseResult: any) {
            if (err) {
                return err;
            }

            result = parseResult;
        });

        // Check for result
        if (result) {
            var code = result.EventNotificationAlert["eventType"][0];
            var action = result.EventNotificationAlert["eventState"][0];
            var index = parseInt(result.EventNotificationAlert["channelID"][0]);
            var count = parseInt(result.EventNotificationAlert["activePostCount"][0]);

            // give codes returned by camera prettier and standardized description
            if (code === "IO") {
                code = "AlarmLocal";
            }
            if (code === "VMD") {
                code = "VideoMotion";
            }
            if (code === "linedetection") {
                code = "LineDetection";
            }
            if (code === "videoloss") {
                code = "VideoLoss";
            }
            if (code === "shelteralarm") {
                code = "VideoBlind";
            }
            if (action === "active") {
                action = "Start";
            }
            if (action === "inactive") {
                action = "Stop";
            }

            // create and event identifier for each recieved event
            // This allows multiple detection types with multiple indexes for DVR or multihead devices
            var eventIdentifier = code + index;

            // Count 0 seems to indicate everything is fine and nothing is wrong, used as a heartbeat
            // if triggerActive is true, lets step through the activeEvents
            // If activeEvents has something, lets end those events and clear activeEvents and reset triggerActive
            if (count === 0) {
                if (_self.triggerActive === true) {
                    for (var i in _self.activeEvents) {
                        if (_self.activeEvents.hasOwnProperty(i)) {
                            var eventDetails = _self.activeEvents[i];
                            if (_self.trace) {
                                console.log(
                                    "Ending Event: " +
                                    i +
                                    " - " +
                                    eventDetails["code"] +
                                    " - " +
                                    (Date.now() - eventDetails["lasttimestamp"]) / 1000
                                );
                            }
              
                            _self.emit("alarm", eventDetails.code, "Stop", eventDetails.index);
                        }
                    }
          
                    _self.activeEvents = {};
                    _self.triggerActive = false;
                } else {
                    // should be the most common result
                    // Nothing interesting happening and we haven't seen any events
                    if (_self.trace) {
                        _self.emit("alarm", code, action, index);
                    }
                }
            } else if (
                typeof _self.activeEvents[eventIdentifier] === "undefined" ||
                _self.activeEvents[eventIdentifier] === null
            ) {
                var eventDetails: any = {};
                eventDetails.code = code;
                eventDetails.index = index;
                eventDetails.lasttimestamp = Date.now();

                _self.activeEvents[eventIdentifier] = eventDetails;
                _self.emit("alarm", code, action, index);
                _self.triggerActive = true;

            // known active events
            } else {
                if (_self.trace) {
                    console.log(
                        "Skipped Event: " + 
                        code + " " + 
                        action + " " + 
                        index + " " + 
                        count
                    );
                }

                // Update lasttimestamp
                var eventDetails: any = {};
                eventDetails.code = code;
                eventDetails.index = index;
                eventDetails.lasttimestamp = Date.now();
                _self.activeEvents[eventIdentifier] = eventDetails;

                // step through activeEvents
                // if we haven't seen it in more than 2 seconds, lets end it and remove from activeEvents
                for (var i in _self.activeEvents) {
                    if (_self.activeEvents.hasOwnProperty(i)) {
                        var eventDetails = _self.activeEvents[i];
                        if ((Date.now() - eventDetails.lasttimestamp) / 1000 > 2) {
                            if (_self.trace) {
                                console.log(
                                    "Ending Event: " +
                                    i +
                                    " - " +
                                    eventDetails["code"] +
                                    " - " +
                                    (Date.now() - eventDetails["lasttimestamp"]) / 1000
                                );
                            }
              
                            _self.emit("alarm", eventDetails.code, "Stop", eventDetails.index);
                            delete _self.activeEvents[i];
                        }
                    }
                }
            }
        }
    }

    // handle connection
    handleConnection() {
        var _self = this;

        if (_self.trace) {
            console.log("Connected to " + this.ipAddress + ":" + this.port);
        }

        _self.emit("connect");
    }

    // handle connection ended
    handleEnd() {
        var _self = this;

        if (_self.trace) {
            console.log("Connection closed!");
        }

        _self.emit("end");
    }

    // handle Errors
    handleError(err: any) {
        var _self = this;

        if (_self.trace) {
            console.log("Connection error: " + err);
        }

        _self.emit("error", err);
    }
}
