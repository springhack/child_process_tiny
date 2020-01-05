{
  'targets': [
    {
      'target_name': 'child_process_tiny',
      'cflags!': [
        '-fno-exceptions'
      ],
      'cflags_cc!': [
        '-fno-exceptions'
      ],
      'sources': [
        'cc/main.cc',
        'cc/tiny-process-library/process.cpp'
      ],
      'include_dirs': [
        '<!@(node -p "require(\'node-addon-api\').include")'
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
      'conditions': [
        ['OS=="win"', {
          'sources': [
            'cc/tiny-process-library/process_win.cpp'
          ],
          'msvs_settings': {
            'VCCLCompilerTool': { 'ExceptionHandling': 1 },
          }
        }],
        ['OS=="mac"', {
          'sources': [
            'cc/tiny-process-library/process_unix.cpp'
          ],
          'cflags+': ['-fvisibility=hidden'],
          'xcode_settings': {
            'GCC_SYMBOLS_PRIVATE_EXTERN': 'YES',
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'OTHER_CFLAGS': [
              '-ObjC++',
              '-Wno-format-security'
            ],
            'CLANG_CXX_LIBRARY': 'libc++',
            'MACOSX_DEPLOYMENT_TARGET': '10.7'
          },
          'libraries': [
            '-framework Foundation',
            '-framework AppKit',
            '-lobjc',
            '-framework IOKit',
            '-lz',
          ]
        }],
        ['OS=="linux"', {
          'sources': [
            'cc/tiny-process-library/process_unix.cpp'
          ]
        }]
      ]
    }
  ]
}
