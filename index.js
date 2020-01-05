/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-05 22:13:32
 *  Filename: index.js
 *  Description: Created by SpringHack using vim automatically.
 */
const lib = require('bindings')('child_process_tiny');


let cp = new lib.Process(
  ['/bin/bash', '-login'],
  '',
  Object.entries({
    NODE_ENV: 'wtfffffff'
  }),
  (buffer) => console.log(`OUT: ${buffer}`),
  (buffer) => console.log(`ERR: ${buffer}`),
  (status) => console.log(`EXIT: ${status}`)
);

lib.spawn(cp, () => {
  cp.write('ls -al && ls -al > /dev/stderr \n\n');
  cp.write('ls -al && ls -al > /dev/stderr \n\n');
  cp.write('ls -al && ls -al > /dev/stderr \nexit\n');
  // cp = null;
});
