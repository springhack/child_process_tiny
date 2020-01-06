/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-01-06 18:23:42
 *  Filename: cc/main.cc
 *  Description: Created by SpringHack using vim automatically.
 */
#include <unordered_map>
#include <iostream>
#include <thread>
#include <vector>
#include <memory>
#include <tuple>

#include <napi.h>

#include "tiny-process-library/process.hpp"

using namespace Napi;

using ProcessArgs = std::vector<TinyProcessLib::Process::string_type>;
using ProcessPath = TinyProcessLib::Process::string_type;
using ProcessEnv = std::unordered_map<ProcessPath, ProcessPath>;

struct out_data {
  const char* bytes;
  size_t n;
  out_data(const char* bytes, size_t n) : bytes(bytes), n(n) {}
};

class Process : public ObjectWrap<Process> {
public:
  Process(const CallbackInfo& info);
  void Finalize(Napi::Env env);

  void Kill(const CallbackInfo& info);
  void CloseStdin(const CallbackInfo& info);
  Napi::Value GetID(const CallbackInfo& info);
  Napi::Value GetExitStatus(const CallbackInfo& info);
  Napi::Value TryGetExitStatus(const CallbackInfo& info);
  Napi::Value Write(const CallbackInfo& info);

  void start_exit_monitor();

  ThreadSafeFunction on_stdout;
  ThreadSafeFunction on_stderr;
  ThreadSafeFunction on_exit;
  ProcessArgs args;
  ProcessPath path;
  ProcessEnv env;
  std::unique_ptr<TinyProcessLib::Process> _process;

  static FunctionReference constructor;
  static void Initialize(Napi::Env env, Object exports);
};

FunctionReference Process::constructor;

Process::Process(const CallbackInfo& info) : ObjectWrap<Process>(info) {
  Array _args = info[0].As<Array>();
  for (uint32_t i = 0; i < _args.Length(); ++i) {
    Napi::Value item = _args[i];
    std::string str = item.As<String>();
    args.push_back(str);
  }
  path = info[1].As<String>();
  Array _env = info[2].As<Array>();
  for (uint32_t i = 0; i < _env.Length(); ++i) {
    uint32_t index = 0;
    Napi::Value item = _env[i];
    Array kv_pair = item.As<Array>();
    item = kv_pair[index++];
    std::string key = item.As<String>();
    item = kv_pair[index];
    std::string value = item.As<String>();
    env[key] = value;
  }
  on_stdout = ThreadSafeFunction::New(info.Env(), info[3].As<Function>(), "process_on_stdout", 0, 1);
  on_stderr = ThreadSafeFunction::New(info.Env(), info[4].As<Function>(), "process_on_stdout", 0, 1);
  on_exit = ThreadSafeFunction::New(info.Env(), info[5].As<Function>(), "process_on_exit", 0, 1);
  _process = nullptr;
}

void Process::Finalize(Napi::Env env) {
  on_stdout.Release();
  on_stderr.Release();
  on_exit.Release();
}

void Process::Kill(const CallbackInfo& info) {
  bool force = info[0].As<Boolean>();
  _process->kill(force);
}

void Process::CloseStdin(const CallbackInfo& info) {
  _process->close_stdin();
}

Value Process::GetID(const CallbackInfo& info) {
  TinyProcessLib::Process::id_type id = _process->get_id();
  return Number::New(info.Env(), id);
}

Value Process::GetExitStatus(const CallbackInfo& info) {
  int status = _process->get_exit_status();
  return Number::New(info.Env(), status);
}

Value Process::TryGetExitStatus(const CallbackInfo& info) {
  int status;
  bool success = _process->try_get_exit_status(status);
  if (success) {
    return Number::New(info.Env(), status);
  }
  return Number::New(info.Env(), -1);
}

Value Process::Write(const CallbackInfo& info) {
  if (info[0].IsString() || info[0].IsBuffer()) {
    bool is_buffer = info[0].IsBuffer();
    std::tuple<bool, std::vector<uint8_t>, std::string> data = std::make_tuple(is_buffer, std::vector<uint8_t>(), "");
    if (is_buffer) {
      Buffer<uint8_t> buffer = info[0].As<Buffer<uint8_t>>();
      uint8_t* _data = reinterpret_cast<uint8_t *>(buffer.Data());
      size_t _length = reinterpret_cast<size_t>(buffer.Length());
      std::get<1>(data).assign(_data, _data + _length);
    } else {
      std::string _str = info[0].As<String>();
      std::get<2>(data).assign(_str);
    }
    ThreadSafeFunction _tsfn = ThreadSafeFunction::New(info.Env(), info[1].As<Function>(), "write_async_worker", 0, 1);
    TinyProcessLib::Process* process = _process.get();
    std::thread([process, data, _tsfn]() {
      try {
        bool* ret = new bool;
        if (std::get<0>(data)) {
          *ret = process->write(reinterpret_cast<const char *>(std::get<1>(data).data()), std::get<1>(data).size());
        } else {
          *ret = process->write(std::get<2>(data));
        }
        _tsfn.BlockingCall(ret, [](Napi::Env env, Function cb, bool* ret) {
          cb.Call({ Boolean::New(env, !*ret) });
          delete ret;
        });
      } catch (std::exception& e) {
        const char* error = strdup(e.what());
        _tsfn.BlockingCall(error, [](Napi::Env env, Function cb, const char* error) {
          cb.Call({ Boolean::New(env, true), String::New(env, error) });
          free((void *)error);
        });
      }
      ThreadSafeFunction(_tsfn).Release();
    }).detach();
    return Boolean::New(info.Env(), true);
  }
  return Boolean::New(info.Env(), false);
}

void Process::Initialize(Napi::Env env, Object exports) {
  Function func = DefineClass(env, "Process", {
    InstanceMethod("kill", &Process::Kill),
    InstanceMethod("close_stdin", &Process::CloseStdin),
    InstanceMethod("get_id", &Process::GetID),
    InstanceMethod("get_exit_status", &Process::GetExitStatus),
    InstanceMethod("try_get_exit_status", &Process::TryGetExitStatus),
    InstanceMethod("write", &Process::Write)
  });
  Process::constructor = Persistent(func);
  Process::constructor.SuppressDestruct();
  exports.Set("Process", func);
}

void Process::start_exit_monitor() {
  std::thread([this]() {
    int* status = new int;
    *status = _process->get_exit_status();
    on_exit.BlockingCall(status, [](Napi::Env env, Function cb, int* status) {
      cb.Call({ Number::New(env, reinterpret_cast<int>(*status)) });
      delete status;
    });
  }).detach();
}

class SpawnAsyncWorker : public AsyncWorker {
public:
  std::unique_ptr<TinyProcessLib::Process> cp;
  Process* process;
  SpawnAsyncWorker(Process* process, Function cb, const char* resource_name)
    : AsyncWorker(cb, resource_name), process(process) {}
  void Execute() override {
    Process* process = this->process;
    cp = std::make_unique<TinyProcessLib::Process>(
      process->args,
      process->path,
      process->env,
      [process](const char* bytes, size_t n) {
        out_data data(bytes, n);
        process->on_stdout.BlockingCall(&data, [](Napi::Env env, Function out, out_data* data) {
          out.Call({ Buffer<char>::Copy(env, data->bytes, data->n) });
        });
      },
      [process](const char* bytes, size_t n) {
        out_data data(bytes, n);
        process->on_stderr.BlockingCall(&data, [](Napi::Env env, Function err, out_data* data) {
          err.Call({ Buffer<char>::Copy(env, data->bytes, data->n) });
        });
      },
      true
    );
    process->_process = std::move(cp);
    process->start_exit_monitor();
  }
};

Value Spawn(const CallbackInfo& info) {
  Object obj = info[0].As<Object>();
  Process* process = ObjectWrap<Process>::Unwrap(obj);
  Function on_create = info[1].As<Function>();
  SpawnAsyncWorker* worker = new SpawnAsyncWorker(process, on_create, "spawn_async_worker");
  worker->Queue();
  return Boolean::New(info.Env(), true);
}

Object Init(Env env, Object exports) {
  Process::Initialize(env, exports);
  exports.Set(String::New(env, "spawn"), Function::New(env, Spawn));
  return exports;
}

NODE_API_MODULE(child_process_tiny, Init)
