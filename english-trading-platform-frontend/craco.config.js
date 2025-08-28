const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@apis': path.resolve(__dirname, 'src/apis'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      // thêm alias tuỳ nhu cầu
    },
  },
  // để Jest hiểu alias khi chạy test
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@styles/(.*)$': '<rootDir>/src/styles/$1',
        '^@pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1'
      }
    }
  }
};
