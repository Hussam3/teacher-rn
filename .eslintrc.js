module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // ملفات ثابتة تُخدَم كما هي (Service Worker في جذر web).
      files: ['web/public/**/*.js'],
      env: { browser: true, serviceworker: true },
    },
  ],
};
