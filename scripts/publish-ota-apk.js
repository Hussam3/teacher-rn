/** Upload a signed direct-distribution APK to the public OTA storage bucket. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { loadLocalEnv } = require('./load-local-env');

const args = process.argv.slice(2);

function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
}

const packageJson = require('../package.json');
const version = getArg('--version', packageJson.version);
const label = getArg('--label', '');
const apkPath = path.resolve(
  getArg(
    '--file',
    path.join('android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  ),
);

loadLocalEnv();

const supabaseUrl =
  process.env.SUPABASE_URL || 'https://yqqedfjadgyktiohkuwg.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required to publish a direct APK.');
  process.exit(1);
}

if (!fs.existsSync(apkPath) || !fs.statSync(apkPath).isFile()) {
  console.error(`APK file was not found: ${apkPath}`);
  process.exit(1);
}

async function main() {
  const apk = fs.readFileSync(apkPath);
  const hash = crypto.createHash('sha256').update(apk).digest('hex');
  const artifactLabel = label ? `-${label}` : '';
  const storagePath = `android/TeacherBag-${version}-ota${artifactLabel}-${Date.now()}.apk`;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.storage.from('app-updates').upload(storagePath, apk, {
    contentType: 'application/vnd.android.package-archive',
    upsert: false,
  });

  if (error) throw new Error(`Failed to upload direct APK: ${error.message}`);

  const { data } = supabase.storage.from('app-updates').getPublicUrl(storagePath);
  console.log('Direct OTA APK uploaded successfully.');
  if (label) console.log(`Architecture: ${label}`);
  console.log(`URL: ${data.publicUrl}`);
  console.log(`SHA-256: ${hash}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
