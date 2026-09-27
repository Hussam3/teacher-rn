const { loadLocalEnv } = require('./load-local-env');
loadLocalEnv();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const prompt = `أنت معلم عراقي متمرس ومحترف في إعداد الخطط التدريسية لوزارة التربية العراقية لمادة الكيمياء للصف الثالث المتوسط.
الموضوع: الترتيب الإلكتروني
مدة الحصة: 45 دقيقة
طريقة التدريس المختارة: المناقشة والحوار

أعد الإجابة بتنسيق JSON فقط بدون أي نص إضافي خارجه، بالبنية التالية:
{
  "objectives": "الأهداف السلوكية...",
  "teachingAids": "الوسائل والأدوات التعليمية...",
  "introduction": "التمهيد وسؤال الاستكشاف...",
  "presentation": "عرض الدرس وشرح المفاهيم والأمثلة...",
  "evaluation": "أسئلة التقويم...",
  "homework": "الواجب البيتي..."
}`;

  const { data, error } = await s.functions.invoke('gemini', {
    body: {
      prompt,
      featureType: 'daily_plan',
      installationId: '00000000-0000-4000-8000-000000000001',
      requestId: '00000000-0000-4000-8000-000000000002',
    }
  });
  if (error && error.context) {
    console.log('BODY:', await error.context.json());
  } else {
    console.log('ERROR:', error);
  }
  console.log('TEXT:', data?.text);
}
test();
