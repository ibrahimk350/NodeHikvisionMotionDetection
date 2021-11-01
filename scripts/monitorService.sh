#!/bin/bash

#######################################
#############Check Service#############
#######################################
# Service
service=hikvision-motion-detection
checkStatus=`ps -eaf | grep -i $service |sed '/^$/d' | wc -l`
serviceTag=false

# Check if running
if [[ $checkStatus > 1 ]]
then
	serviceTag=true;
	serviceStatus="$service is running.\n"
else
    serviceTag=false;
	serviceStatus="$service service is not running.\n"
fi

if [ !$serviceTag ]
then
    # {FOR YOU TO DO}
    # You can log it to a logger or
    # send your self an email notification
    # The choice is yours.
fi
