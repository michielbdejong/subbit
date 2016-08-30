#!/bin/bash
node gen-circuits-n-0.js 1
node enumerate.js 1 1

node gen-circuits-n-0.js 2
node enumerate.js 2 1

node gen-circuits-n-0.js 3
node enumerate.js 3 1
node enumerate.js 3 2
node enumerate.js 3 3
node enumerate.js 3 4

node gen-circuits-n-0.js 4
node enumerate.js 4 1
node enumerate.js 4 2
node enumerate.js 4 3

node count.js 1 1
node count.js 2 1
node count.js 3 4
node count.js 4 3
