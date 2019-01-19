module.exports = {
    extends: 'airbnb',
    parser: 'babel-eslint',
    env: {
        es6: true,
        node: true,
        browser: true
    },
    plugins: ['react'],
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        experimentalDecorators: true,
        ecmaFeatures: {
            experimentalObjectRestSpread: true
        }
    },
    rules: {
        semi: ['warn', 'always'],
        'no-plusplus': 0,
        'class-methods-use-this': 0,
        'prefer-destructuring': 0,
        'no-param-reassign': 0,
        indent: ['warn', 4],
        'no-cond-assign': ['warn', 'always'],
        'no-set-state': 'on',
        'no-template-curly-in-string': 'warn',
        'no-redeclare': 'warn',
        'wrap-iife': 'warn',
        'no-undef': 'warn',
        'import/extensions': ['off', 'never'],
        'import/no-extraneous-dependencies': 0,
        'import/no-unresolved': 2,
        'comma-dangle': [2, 'never'],
        'no-underscore-dangle': ['warn'],
        'max-len': ['warn', 120],
        'func-names': 0,
        'linebreak-style': [0, 'unix'],
        'no-console': ['warn'],
        'no-magic-numbers': 0,
        'react/jsx-indent': 0,
        'react/jsx-indent-props': 0,
        'react/forbid-prop-types': 0,
        'react/jsx-filename-extension': [
            1,
            {
                extensions: ['.js']
            }
        ],
        'react/no-array-index-key': 0,
        'react/no-unused-state': 1,
        'react/prop-types': 1,
        'react/require-default-props': 1,
        'arrow-parens': 1,
        'arrow-body-style': [0, 'as-needed'],
        'function-paren-newline': [0, 'as-needed'],
        'object-curly-newline': 0
    }
};
