/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-09 16:52:54
 *  Filename: test.js
 *  Description: Created by SpringHack using vim automatically.
 */
const { exec, spawn } = require('./lib');

(async () => {
  // Test for spawn
  const ps = await spawn('/bin/bash', ['-login'], {
    cwd: '/tmp',
    env: {
      NODE_ENV: 'test-node-env'
    }
  });
  ps.stdout.pipe(process.stdout);
  ps.stderr.pipe(process.stderr);
  ps.stdin.write('echo NODE_ENV is: $NODE_ENV\n');
  ps.stdin.write('echo PWD is: $(pwd)\n');
  ps.stdin.write('exit\n');
  // Test for exec
  // exec('ls -al', (status, out, err) => {
  //   console.log(status, out, err);
  // });
})();
