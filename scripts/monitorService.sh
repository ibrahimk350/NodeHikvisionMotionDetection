#!/bin/bash

#######################################
#############Check Service#############
#######################################
# Service
service=hikvision-motion-detection
checkStatus=`systemctl is-active $service`
serviceTag=false

# Check if running
if [[ $checkStatus == "active" ]]
then
	serviceTag=true;
	serviceStatus="$service is running.\n"
else
    serviceTag=false;
	serviceStatus="$service service is not running.\n"
fi

if [ $serviceTag == "false" ]
then
    # {FOR YOU TO DO}
    # You can log it to a logger or
    # send your self an email notification
    # The choice is yours.
fi
