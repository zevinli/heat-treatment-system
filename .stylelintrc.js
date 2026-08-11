module.exports = {
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.min.css',
  ],
  rules: {
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'comment-no-empty': true,
    'declaration-block-no-duplicate-custom-properties': true,
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-values'] },
    ],
    'font-family-no-duplicate-names': true,
    'function-calc-no-unspaced-operator': true,
    'keyframe-declaration-no-important': true,
    'property-no-unknown': true,
    'selector-pseudo-class-no-unknown': [
      true,
      { ignorePseudoClasses: ['global'] },
    ],
    'selector-pseudo-element-no-unknown': true,
    'unit-no-unknown': true,
  },
};
