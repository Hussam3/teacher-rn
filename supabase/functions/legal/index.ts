// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function page(message = ''): Response {
  const notice = message
    ? `<p class="notice">${message}</p>`
    : '';
  return new Response(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>سياسة الخصوصية وحذف الحساب | حقيبة المدرس</title>
  <style>
    body { background: #f5f8fb; color: #162033; font-family: Arial, sans-serif; line-height: 1.8; margin: 0; }
    main { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #16304a18; margin: 32px auto; max-width: 760px; padding: 28px; }
    h1, h2 { color: #126eaa; line-height: 1.35; }
    h1 { font-size: 26px; } h2 { font-size: 20px; margin-top: 30px; }
    li { margin-bottom: 8px; } .notice { background: #e8f7ee; border: 1px solid #98d7ad; border-radius: 8px; color: #166534; padding: 12px; }
    form { background: #f2f8fc; border-radius: 10px; margin-top: 12px; padding: 18px; }
    label, input, button { display: block; font: inherit; width: 100%; box-sizing: border-box; }
    input { border: 1px solid #a8bac8; border-radius: 8px; margin: 8px 0 14px; padding: 11px; }
    button { background: #c62828; border: 0; border-radius: 8px; color: #fff; cursor: pointer; padding: 11px; }
    small { color: #536273; }
  </style>
</head>
<body><main>
  <h1>سياسة خصوصية حقيبة المدرس العراقي</h1>
  <p>تاريخ السريان: 30 أغسطس 2026. يقدّم تطبيق <strong>حقيبة المدرس العراقي</strong> أدوات للمعلمين لإدارة الخطط والجدول والدرجات والمستندات.</p>
  <h2>البيانات التي نعالجها</h2>
  <ul>
    <li>بيانات الحساب عند تسجيل الدخول عبر Google أو Facebook، مثل الاسم والبريد الإلكتروني والصورة التعريفية ومعرّف الحساب.</li>
    <li>المحتوى الذي ينشئه المعلم، مثل المواد والجدول والخطط والوثائق وسجل الدرجات وأسماء الطلاب، عند تفعيل المزامنة السحابية.</li>
    <li>النصوص والصور التي يختارها المستخدم عند استخدام ميزات الذكاء الاصطناعي؛ تُرسل إلى خدمة Gemini فقط لتنفيذ الطلب.</li>
    <li>الصوت عند استخدام الإملاء الصوتي؛ تعالجه خدمة التعرّف على الصوت التي يختارها الجهاز.</li>
  </ul>
  <h2>الغرض والمشاركة</h2>
  <p>نستخدم البيانات لتقديم وظائف التطبيق، حفظها ومزامنتها بين أجهزة المستخدم، وتنفيذ طلبات الذكاء الاصطناعي. تُعالج البيانات السحابية بواسطة Supabase، والمصادقة بواسطة Google أو Facebook، وطلبات الذكاء الاصطناعي بواسطة Google Gemini. لا نبيع البيانات ولا نستخدمها للإعلانات أو التتبع.</p>
  <h2>التخزين والأمان</h2>
  <p>تُخزَّن البيانات محلياً على الجهاز، وتُنقل عبر اتصالات مشفرة عند استخدام الخدمات السحابية. تبقى البيانات السحابية حتى يحذف المستخدم حسابه أو يطلب حذفها.</p>
  <h2>حذف الحساب والبيانات</h2>
  <p>يمكن للمستخدم المسجّل الدخول حذف الحساب وبياناته السحابية فوراً من: الإعدادات ← حذف الحساب والبيانات السحابية. حذف الحساب لا يحذف حساب Google أو Facebook نفسه.</p>
  <p>إذا حُذف التطبيق أو تعذّر الوصول إليه، أرسل طلب حذف عبر النموذج الآتي. نراجع الطلب وننفذه خلال 30 يوماً، ما لم يتطلب القانون الاحتفاظ ببيانات محددة.</p>
  ${notice}
  <form method="post">
    <label for="email">البريد الإلكتروني المرتبط بالحساب</label>
    <input id="email" name="email" type="email" maxlength="320" required autocomplete="email">
    <button type="submit">إرسال طلب حذف الحساب</button>
    <small>يُستخدم البريد للتحقق من ملكية الحساب ومعالجة الطلب فقط.</small>
  </form>
  <h2>الأطفال</h2>
  <p>التطبيق موجّه للمعلمين والبالغين، وليس مخصصاً للأطفال.</p>
</main></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

Deno.serve(async req => {
  if (req.method === 'GET') {
    const submitted = new URL(req.url).searchParams.get('submitted');
    return page(submitted === '1' ? 'تم تسجيل طلبك. سنراجع الطلب وننفذه بعد التحقق من ملكية الحساب.' : '');
  }
  if (req.method !== 'POST') return page('الطريقة غير مدعومة.');

  const form = await req.formData().catch(() => null);
  const email = String(form?.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return page('أدخل بريداً إلكترونياً صالحاً مرتبطاً بالحساب.');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return page('خدمة الطلبات غير مهيأة حالياً. حاول لاحقاً.');
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.from('account_deletion_requests').insert({
    email,
    user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
  });
  if (error) {
    console.error('Could not create account deletion request', error);
    return page('تعذر تسجيل الطلب حالياً. حاول لاحقاً.');
  }

  const url = new URL(req.url);
  url.search = 'submitted=1';
  return Response.redirect(url, 303);
});
