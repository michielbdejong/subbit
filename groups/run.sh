#!/bin/bash
node gen-circuits-n-0.js 1
node enumerate-streaming.js 1 1
node filter-dupes.js 1 1

node gen-circuits-n-0.js 2
node enumerate-streaming.js 2 1
node filter-dupes.js 2 1

node gen-circuits-n-0.js 3
node enumerate-streaming.js 3 1
node filter-dupes.js 3 1
node enumerate-streaming.js 3 2
node filter-dupes.js 3 2
node enumerate-streaming.js 3 3
node filter-dupes.js 3 3
node enumerate-streaming.js 3 4
node filter-dupes.js 3 4

node gen-circuits-n-0.js 4
node enumerate-streaming.js 4 1
node filter-dupes.js 4 1
node enumerate-streaming.js 4 2
node filter-dupes.js 4 2
node enumerate-streaming.js 4 3
node filter-dupes.js 4 3
node enumerate-streaming.js 4 4
node filter-dupes.js 4 4
node enumerate-streaming.js 4 5
cp circuits-4-5.txt circuits-4-5-with-dupes.txt
node filter-dupes.js 4 5

node count.js 1 1
node count.js 2 1
node count.js 3 4
node count.js 4 5
