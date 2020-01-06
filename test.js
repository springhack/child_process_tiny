/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-06 14:04:42
 *  Filename: test.js
 *  Description: Created by SpringHack using vim automatically.
 */
const { spawn } = require('./lib');


(async () => {
  const ps = await spawn(['/bin/bash', '-login'], '', { NODE_ENV: 'testasdasdasd' })
  try {
    const ret = await ps.write('ls -al\n');
  } catch(e) {
    console.error(e);
  }
})();
