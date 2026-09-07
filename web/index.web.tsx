/**
 * نقطة الدخول على الويب — تسجيل التطبيق وتشغيله في المتصفح.
 */
import { AppRegistry } from 'react-native';
import { App } from '../src/app/App';
import '../global.css';

AppRegistry.registerComponent('TeacherBag', () => App);
AppRegistry.runApplication('TeacherBag', {
  initialProps: {},
  rootTag: (document.getElementById('root') ?? document.body) as any,
});
