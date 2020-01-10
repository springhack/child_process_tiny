/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-09 21:34:18
 *  Filename: test.js
 *  Description: Created by SpringHack using vim automatically.
 */
const iconv = require('iconv-lite');
const { exec, spawn } = require('./lib');

(async () => {
  // Test for spawn in win32
  if (process.platform === 'win32') {
    const ps = await spawn('cmd', [], {
      cwd: '',
      env: {
        NODE_ENV: 'test-node-env'
      }
    });
    ps.stdout.pipe(iconv.decodeStream('gb2312')).pipe(process.stdout);
    ps.stderr.pipe(process.stderr);
    ps.stdin.write('echo NODE_ENV is: %NODE_ENV%\n');
    ps.stdin.write('dir\n');
    ps.stdin.write('exit\n');
    return;
  }
  // Test for spawn in unix
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
  // Test for exec in unix
  exec('/bin/ls -al', (status, out) => {
    console.log(status);
    console.log(out.toString());
  });
})();
