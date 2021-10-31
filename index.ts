import * as fs from 'fs';
import { hikvisionClass } from './hikvisionClass';
import { execFile } from 'child_process';

// Process Config File
var config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
var zoneMinderIP = config['zoneMinderIP'];
var zoneMinderPort = config['zoneMinderPort'];
var zoneMinderGroup = config['zoneMinderGroup'];

// Setup Cameras
zoneMinderGroup.forEach((element: any) => {
	// Check for empty configs
	var name = element.name ? element.name : '';
	var ip = element.camera.ip ? element.camera.ip : '';
	var port = element.camera.port ? element.camera.port : '';
	var user = element.camera.username ? element.camera.username : '';
	var pass = element.camera.password ? element.camera.password : '';
	var monitorId = element.monitor.id ? element.monitor.id : '';

	// Instantiate class
	var cameraClass = new hikvisionClass(ip, port, user, pass);	

	// Show a connection message
	console.log("Connected to: [" + name + "] Camera. Waiting for Motion. \n");

	// on Alarm Events
	cameraClass.on('alarm', 
		async function(code: any, action: any) {
			if (code === 'VideoMotion' && action === 'Start') {
				console.log("[" + name + "] Video Recording Started.");
				
				prepareMessage(zoneMinderIP, zoneMinderPort, monitorId, 'on');
			}

			if (code === 'VideoMotion' && action === 'Stop') {
				console.log("[" + name + "] Video Recording Stopped.");

				prepareMessage(zoneMinderIP, zoneMinderPort, monitorId, 'off');
			}
		});	
});

// Call the sendMessage script
function prepareMessage(
	ZoneMinderIP: string,
	ZoneMinderPort: number,
	MonitorId: number,
	Action: string
) {
	execFile('/bin/sh', 
		[
			'./sendMessage.sh', 
			`${ZoneMinderIP}`, 
			`${ZoneMinderPort}`, 
			`${MonitorId}`, 
			`${Action}`
		]
	);
}