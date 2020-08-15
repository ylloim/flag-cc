import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';

export default {
  input: ['flag-cc.js'],
  output: {
    file: 'build/index.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    babel({
      babelHelpers: 'bundled',
    }),
    copy({
      targets: [
        {
          src: 'flags',
          dest: 'build/node_modules/flag-cc/',
        },
      ],
    }),
  ],
};
