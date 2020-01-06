/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-06 19:24:18
 *  Filename: test.js
 *  Description: Created by SpringHack using vim automatically.
 */
const { spawn } = require('./lib');


(async () => {
  const ps = await spawn(['/bin/bash', '-login'], '', { NODE_ENV: 'testasdasdasd' })
  ps.stdout.on('data', process.stdout.write);
  ps.stderr.on('data', process.stderr.write);
  ps.stdin.write('ls -al\n');
})();
