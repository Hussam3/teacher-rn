/**
 * سكريبت النشر التلقائي للتحديثات الفورية (OTA Live Updates) إلى Supabase
 *
 * الاستخدام:
 *   node scripts/publish-ota.js --version 1.0.1 --notes "إصلاحات في الطباعة والمحرر"
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { loadLocalEnv } = require('./load-local-env');

// استخراج المعاملات من سطر الأوامر
const args = process.argv.slice(2);
function getArg(flag, defaultValue = '') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const versionName = getArg('--version', `1.0.${Date.now().toString().slice(-4)}`);
const releaseNotes = getArg('--notes', 'تحديثات وتحسينات عامة في الأداء والواجهة');
const isMandatory = args.includes('--mandatory');

loadLocalEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yqqedfjadgyktiohkuwg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required to publish OTA updates.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('====================================================');
  console.log(`🚀 بدء بناء ونشر التحديث الفوري (OTA): الإصدار ${versionName}`);
  console.log('====================================================');

  const distDir = path.join(__dirname, '..', 'dist', 'ota');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const bundlePath = path.join(distDir, 'index.android.bundle');

  console.log('📦 1. جارٍ بناء حزمة JavaScript والأصول عبر React Native Bundle...');
  try {
    execSync(
      `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output "${bundlePath}" --assets-dest "${distDir}"`,
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.error('❌ فشل بناء حزمة React Native Bundle:', err.message);
    process.exit(1);
  }

  console.log('🔐 2. حساب البصمة الرقمية للحزمة (SHA-256 Hash)...');
  const bundleBuffer = fs.readFileSync(bundlePath);
  const hash = crypto.createHash('sha256').update(bundleBuffer).digest('hex');
  console.log(`   SHA-256: ${hash}`);

  const fileName = `bundle_android_${versionName}_${Date.now()}.bundle`;
  const storagePath = `android/${fileName}`;

  console.log(`☁️ 3. جارٍ رفع الحزمة إلى Supabase Storage (حاوية app-updates)...`);
  const { error: uploadError } = await supabase.storage
    .from('app-updates')
    .upload(storagePath, bundleBuffer, {
      contentType: 'application/javascript',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`فشل رفع حزمة OTA: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('app-updates')
    .getPublicUrl(storagePath);

  const bundleUrl = publicUrlData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/app-updates/${storagePath}`;

  console.log(`📝 4. تسجيل التحديث في جدول app_updates في قاعدة بيانات Supabase...`);
  const { data: insertData, error: insertError } = await supabase
    .from('app_updates')
    .insert([
      {
        platform: 'android',
        version_name: versionName,
        version_code: Math.floor(Date.now() / 1000),
        bundle_url: bundleUrl,
        bundle_hash: hash,
        release_notes: releaseNotes,
        is_mandatory: isMandatory,
        is_active: true,
      },
    ])
    .select();

  if (insertError) {
    throw new Error(`فشل تسجيل تحديث OTA: ${insertError.message}`);
  }

  console.log('✅ تم تسجيل ونشر التحديث الفوري بنجاح!');
  console.log(`   رابط الحزمة: ${bundleUrl}`);
  console.log(`   ملاحظات الإصدار: ${releaseNotes}`);

  // تنبيه: يجب أن تكون حاوية التخزين عامة حتى ينجح الهاتف في تنزيل البندل.
  if (!/^https?:\/\//i.test(bundleUrl)) {
    console.warn('⚠️ رابط الحزمة ليس رابطاً قابلاً للتحميل (http/https).');
    console.log('   تأكد من أن حاوية "app-updates" عامة (Public) في Supabase Storage.');
  } else {
    console.log('ℹ️ للتأكد من قابلية التحميل، افتح : ' + bundleUrl + ' في المتصفح');
    console.log('   يجب أن تكون حاوية "app-updates" عامة (Public) في Supabase Storage،');
    console.log('   وإلا سيفشل تنزيل التحديث على أجهزة المستخدمين.');
  }

  console.log('====================================================');
  console.log('🎉 اكتملت العملية. سيستلم جميع المستخدمين التحديث فورياً!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('❌ حدث خطأ غير متوقع:', err);
  process.exit(1);
});
