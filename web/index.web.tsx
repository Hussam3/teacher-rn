/**
 * نقطة الدخول على الويب — تسجيل التطبيق وتشغيله في المتصفح مع معالجة آمنة لأخطاء الإقلاع.
 */
import { AppRegistry } from 'react-native';
import { App } from '../src/app/App';
import '../global.css';

try {
  AppRegistry.registerComponent('TeacherBag', () => App);
  AppRegistry.runApplication('TeacherBag', {
    initialProps: {},
    rootTag: (document.getElementById('root') ?? document.body) as any,
  });
} catch (err: any) {
  console.error('[Web Startup Error]', err);
  const root = document.getElementById('root') ?? document.body;
  if (root) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:24px;font-family:sans-serif;direction:rtl;text-align:center;">
        <h2 style="color:#d32f2f;margin-bottom:8px;">تعذر تحميل التطبيق</h2>
        <p style="color:#555;font-size:14px;max-width:400px;line-height:22px;margin-bottom:16px;">
          ${err?.message || 'حدث خطأ غير متوقع أثناء تشغيل واجهة الويب.'}
        </p>
        <button onclick="window.location.reload()" style="padding:10px 24px;background:#24A1DE;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;">
          إعادة المحاولة
        </button>
      </div>
    `;
  }
}
