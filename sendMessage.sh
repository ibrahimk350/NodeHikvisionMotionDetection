#!/bin/sh

# Run the command
ipAddress=$1
port=$2
monitorId=$3
action=$4

# Send the command
echo "$monitorId|$action|$monitorId|Motion Detected|Motion Detected" | nc $ipAddress $port -w 1