#!/bin/sh
while true; do
       node --max-old-space-size=10000 minimal-circuit-arch.js 3
       sleep 1
       node updateMainProgress.js
       sleep 1
       node count.js
       sleep 1
done
