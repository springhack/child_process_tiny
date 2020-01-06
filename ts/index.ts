/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-06 19:11:23
 *  Filename: ts/index.ts
 *  Description: Created by SpringHack using vim automatically.
 */
import bindings from 'bindings';
import { EventEmitter } from 'events';
import { Writable, Readable } from 'stream';

const binding = bindings('child_process_tiny');

type IArgs = Array<string>;
type IPath = string;
interface IEnv {
  [key: string]: string;
}

class ChildProcessTiny extends EventEmitter {
  public stdout: Readable = new Readable();
  public stderr: Readable = new Readable();
  public stdin: Writable = new Writable();
  public _cp: any;

  private _write(data: string | Buffer): Promise<ChildProcessTiny> {
    return new Promise((resolve, reject) => {
      this._cp.write(data, (error: boolean, message: string) => {
        if (error) {
          return reject(message);
        }
        return resolve(this);
      });
    });
  }

  constructor() {
    super();
    this.stdin._write = (chunk: Buffer | string, encoding: string, callback: (error?: Error) => void) => {
      void(encoding);
      this.
        _write(chunk)
        .then(() => callback())
        .catch(error => callback(error));
    };
    this.stdout._read = this.stderr._read = (size: number) => void(size);
    this.stdin.end = () => this._cp.close_stdin();
  }

  public kill(force = false) {
    this._cp.kill(force);
  }

  public get pid(): number {
    return this._cp.get_id();
  }

  public getExitStatus(): number {
    return this._cp.get_exit_status();
  }

  public tryGetExitStatus(): number {
    return this._cp.try_get_exit_status();
  }

  public exit(): void {
    this._cp.kill(false);
  }
}

export function spawn(args: IArgs = [], path: IPath = '', env: IEnv = {}): Promise<ChildProcessTiny> {
  return new Promise((resolve) => {
    const _process = new ChildProcessTiny();
    const cp = new binding.Process(args, path, Object.entries(env), (buffer: Buffer) => {
      _process.stdout.push(buffer);
    }, (buffer: Buffer) => {
      _process.stderr.push(buffer);
    }, (status: number) => {
      _process.stdout.push(null);
      _process.stdout.push(null);
      _process.emit('exit', status);
    });
    _process._cp = cp;
    binding.spawn(cp, () => {
      resolve(_process);
    });
  });
};
