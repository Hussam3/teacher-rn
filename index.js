/**
 * @format
 */
// Polyfills مطلوبة لـ Supabase في React Native
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import { App } from './src/app/App';
import { LicenseAdminApp } from './src/licenseAdminMobile/AdminApp';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('TeacherBagAdmin', () => LicenseAdminApp);
