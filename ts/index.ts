/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-06 02:48:00
 *  Filename: ts/index.ts
 *  Description: Created by SpringHack using vim automatically.
 */
import bindings from 'bindings';
import { EventEmitter } from 'events';

const binding = bindings('child_process_tiny');

type IArgs = Array<string>;
interface IEnv {
  [key: string]: string;
}

class Process extends EventEmitter {
  public stdout: EventEmitter = new EventEmitter();
  public stderr: EventEmitter = new EventEmitter();
  public _cp: any;
  public write(data: string | Buffer) {
    this._cp.write(data);
  }
}

export function spawn(args: IArgs = [], path: string = '', env: IEnv = {}): Promise<Process> {
  return new Promise((resolve) => {
    const _process = new Process();
    const cp = new binding.Process(args, path, Object.entries(env), (buffer: Buffer) => {
      _process.stdout.emit('data', buffer);
    }, (buffer: Buffer) => {
      _process.stderr.emit('data', buffer);
    }, (status: number) => {
      _process.emit('exit', status);
    });
    _process._cp = cp;
    resolve(_process);
  });
};
