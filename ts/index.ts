/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-09 16:50:50
 *  Filename: ts/index.ts
 *  Description: Created by SpringHack using vim automatically.
 */
import bindings from 'bindings';
import { EventEmitter } from 'events';
import { Writable, PassThrough } from 'stream';

const binding = bindings('child_process_tiny');
const preventGCSet = new Set();

type IArgs = Array<string>;
type IWorkDir = string;
interface IEnv {
  [key: string]: string;
}
interface IOptions {
  cwd?: IWorkDir;
  env?: IEnv;
  argv0?: string;
  [key: string]: any;
}
type IExecCallback = (error: Error | void, stdout: void | string | Buffer, stderr: void | string | Buffer) => void;

class ChildProcessTiny extends EventEmitter {
  public stdout: PassThrough = new PassThrough();
  public stderr: PassThrough = new PassThrough();
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
    this.stdin.end = () => this._cp.close_stdin();
    this.stdout.resume();
    this.stderr.resume();
    preventGCSet.add(this);
    this.on('exit', () => {
      preventGCSet.delete(this);
    });
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

export function spawn(command: string, args: IArgs = [], options: IOptions = {}): Promise<ChildProcessTiny> {
  if (!command) throw new Error('At least command needed !');
  const _options: IOptions = { ...options };
  if (!_options.argv0) {
    _options.argv0 = command;
  }
  if (!_options.env) {
    _options.env = {};
  }
  return new Promise((resolve) => {
    const _process = new ChildProcessTiny();
    const cp = new binding.Process([_options.argv0, ...args], _options.cwd || process.cwd(), Object.entries(_options.env), (buffer: Buffer) => {
      _process.stdout.write(Buffer.from(buffer));
    }, (buffer: Buffer) => {
      _process.stderr.write(Buffer.from(buffer));
    }, (status: number) => {
      _process.stdout.end();
      _process.stdout.end();
      _process.emit('exit', status);
    });
    _process._cp = cp;
    binding.spawn(cp, () => {
      resolve(_process);
    });
  });
};

export function exec(command: string, options: IOptions = {}, callback: IExecCallback = () => {}): void {
  const [ _command, ..._args ] = command.split(/\s+/);
  if ('function' == typeof options) {
    callback = options;
    options = {};
  }
  spawn(_command, _args, options)
    .then((ps) => {
      let out: Buffer | void;
      let err: Buffer | void;
      ps.stdout.on('data', (chunk) => {
        out = Buffer.concat([out || Buffer.from([]), Buffer.from(chunk)]);
      });
      ps.stderr.on('data', (chunk) => {
        err = Buffer.concat([err || Buffer.from([]), Buffer.from(chunk)]);
      });
      ps.on('exit', (status) => {
        callback(status, out, err);
        out = err = null;
      });
    })
    .catch((error) => {
      callback(error, '', '');
    });
};
