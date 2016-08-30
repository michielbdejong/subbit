var fs = require('fs');

var numVars = parseInt(process.argv[2]);
//32768 16384 8192 4096 | 2048 1024 512 256 | 128 64 32 16 | 8 4 2 1
//                      |                   |              |       * 1 A
//
//                      |                   |              |     * * 3 A
//                      |                   |              |   *   * 5 B
//
//                      |                   |              | * * * * 15 A
//                      |                   |         *  * |     * * 51 B
//                      |                   |      *     * |   *   * 85 C
//
//                      |                   |   *  *  *  * | * * * * 255 A
//                      |    *    *   *   * |              | * * * * (2048+1024+512+256+15)= 3855 B
//                *   * |             *   * |         *  * |     * * (8192+4096+512+256+32+16+2+1)=13107 C
//           *        * |         *       * |      *     * |   *   * (16384+4096+1024+256+64+16+4+1)=21845 D
//
// circuits are grouped by the stack of wires they provide
// all wires are signed so that they're zero if all inputs are zero,
// and represented by the sum of input valuations for which they are one.

fs.writeFileSync(`circuits-${numVars}-0.txt`, JSON.stringify({
  stack: {
    1: [1],
    2: [3, 5],
    3: [15, 51, 85],
    4: [255, 3855, 13107, 21845],
  }[numVars],
  circuit: [],
}) + '\n');
