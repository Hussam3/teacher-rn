# حقيبة المدرس — Teacher's Bag (React Native)

مساعد رقمي متكامل للمدرس العراقي: إدارة المناهج والخطط اليومية والسنوية وجدول الحصص وسجل الدرجات ومحرر الأسئلة الامتحانية.

> إعادة بناء كاملة من مشروع Flutter الأصلي إلى **React Native + TypeScript** بمعمارية نظيفة قائمة على الميزات، مع إعادة تصميم كاملة لواجهة المستخدم وتفعيل تنبيهات الحصص الفعلية.

## المكدس التقني

| المجال                 | التقنية                                                  |
| ---------------------- | -------------------------------------------------------- |
| اللغة                  | TypeScript (strict)                                      |
| البيئة                 | React Native 0.87 (Bare CLI)                             |
| التنقل                 | React Navigation v7 (Typed)                              |
| إدارة الحالة           | Zustand                                                  |
| البيانات غير المتزامنة | TanStack React Query                                     |
| التخزين المحلي         | MMKV (عبر react-native-mmkv + Nitro)                     |
| التحقق من البيانات     | Zod                                                      |
| التنسيق                | NativeWind v4 + نظام Design Tokens                       |
| الحركات                | Reanimated 3 + Gesture Handler                           |
| الإشعارات              | Notifee                                                  |
| PDF (توليد)            | react-native-html-to-pdf بخطوط عربية مدمجة               |
| PDF (عرض)              | react-native-pdf                                         |
| المصادقة               | Supabase Auth (Google OAuth + PKCE) + وضع الضيف          |
| المزامنة السحابية      | Supabase Postgres + Realtime (بيانات المعلم عبر الأجهزة) |
| الذكاء الاصطناعي       | Gemini 2.5 Flash عبر Supabase Edge Function              |

## التشغيل

```bash
npm install

# أندرويد
npm run android

# اختبارات المنطق
npm test

# فحص الأنواع
npm run typecheck

# فحص الكود
npm run lint
```

> يتطلب `JAVA_HOME` إلى JDK 17+ (مثل JBR في Android Studio) و SDK أندرويد.

## البنية المعمارية

```
src/
├── app/            # نقطة الدخول، المزوّدات، التنقل (Typed Navigation)
├── shared/
│   ├── types/      # نماذج المجال (TS) + مخططات Zod
│   ├── ui/         # نظام التصميم (Button, Card, Dialog, Sheet, ...)
│   ├── theme/      # رموز التصميم + مزوّد الثيم (فاتح/داكن)
│   ├── i18n/       # سجل النصوص العربية المركزي
│   ├── lib/        # MMKV، QueryClient، الاهتزازات
│   ├── hooks/      # useResponsive وغيرها
│   ├── constants/  # بيانات المناهج
│   └── utils/      # دوال نقية (تواريخ، تجزئة، حساب الدرجات، توزيع شهري)
├── data/           # طبقة الوصول للبيانات (Repositories) + النسخ الاحتياطي
├── services/       # AI، المناهج، PDF، الطباعة، التنبيهات، الصوت
└── features/       # auth, schedule, daily_plan, annual_plan, gradebook, library, editor, settings
```

**القاعدة الذهبية**: مكوّنات الواجهة (`features/`) لا تلمس التخزين مباشرة أبداً — كل الوصول عبر `data/repositories`. `services/` لا يعتمد على React. النماذج في `shared/types` نقية 100%.

## الميزات

- **الجدول الأسبوعي**: شبكة 5 أيام × 7 حصص، إبراز اليوم الحالي، شريط حصص اليوم، ألوان ثابتة للمواد (FNV-1a)، تنبيهات حقيقية قبل الحصة عبر Notifee.
- **الخطة اليومية**: معالج ذكي (مادة ← تفاصيل ← محرر) + توليد بالذكاء الاصطناعي + تصدير/طباعة PDF.
- **الخطة السنوية**: توزيع شهري حتمي محسوب محلياً (أيلول ← أيار) + إثراء بالذكاء الاصطناعي + محرر أشهر + PDF.
- **سجل الدرجات**: جدول بعمود طالب مجمّد، أعمدة محسوبة (معدل/مجموع) بمنطق موحّد، إحصاءات، تقرير طالب، PDF.
- **المكتبة**: تنزيل كتب المنهج من Google Drive، رفع PDF، معاينة، حذف.
- **المحرر**: محرر كتل مخصص (فقرات، عناوين، أسئلة بفروع، إجابات، جداول، قوائم) + ترويسة امتحان + إعدادات طباعة + توليد أسئلة بالذكاء الاصطناعي + تصدير/طباعة/مشاركة.
- **الإعدادات**: وضع الثيم، حالة خدمة الذكاء الاصطناعي، الحساب، تصدير/استيراد نسخة احتياطية، إعادة تعيين.
- **المصادقة**: دخول ضيف (بدون إنترنت) + دخول Google وFacebook (Supabase OAuth + PKCE) + استعادة الجلسة تلقائياً.
- **المزامنة السحابية**: حفظ بيانات المعلم في Supabase وتحميلها على أي جهاز بنفس الحساب، مع مزامنة لحظية بين الأجهزة.
- **التراخيص**: بوابة تفعيل عربية قبل الدخول، تجربة مجانية 3 أيام، والتحقق الخلفي من الرمز والصلاحية والأجهزة المسموحة.

## إدارة التراخيص

يوجد نظام تراخيص ولوحة ويب مستقلة للمالك في `license-admin/`. راجع خطة الإعداد والنشر الكاملة في [`docs/license-management-plan.md`](docs/license-management-plan.md) قبل نشر نسخة التطبيق التي تتضمن التفعيل.

## إعداد Supabase (المصادقة والمزامنة والذكاء الاصطناعي المشترك)

وضع الضيف يعمل محلياً بدون إعداد، لكن الذكاء الاصطناعي المشترك يتطلب حساباً مسجلاً.
لتفعيل دخول Google أو Facebook وقاعدة البيانات السحابية وحماية استخدام الذكاء الاصطناعي:

1. أنشئ مشروعاً في [Supabase](https://supabase.com) (أو استخدم الموجود).
2. من **SQL Editor** شغّل محتوى `supabase/schema.sql` (ينشئ جدول
   `teacher_data` مع حماية RLS وRealtime، وجدول حدود استخدام الذكاء الاصطناعي).
3. من **Authentication → URL Configuration** اضبط Site URL أثناء التطوير على:
   ```
   http://localhost:5174
   ```
   وأضف هذه القيم إلى **Redirect URLs**:
   ```
   http://localhost:5174/auth/callback
   teacherbag://auth-callback
   ```
   أضف أيضاً `<رابط-موقعك-المنشور>/auth/callback` عند نشر الويب.
4. من **Authentication → Providers → Google** فعّل Google وضع Google OAuth
   Client ID وClient Secret. في Google Cloud أنشئ OAuth Client من نوع
   **Web application**، وأضف `http://localhost:5174` في Authorized JavaScript
   origins أثناء التطوير، ثم أضف هذا في Authorized redirect URIs:
   ```
   https://yqqedfjadgyktiohkuwg.supabase.co/auth/v1/callback
   ```
5. من **Authentication → Providers → Facebook** فعّل Facebook وضع Facebook
   App ID وApp Secret. في **Meta for Developers → Facebook Login → Settings**
   أضف الرابط نفسه في Valid OAuth Redirect URIs:
   ```
   https://yqqedfjadgyktiohkuwg.supabase.co/auth/v1/callback
   ```
   إذا بقي تطبيق Facebook في Development Mode، أضف حسابات الاختبار ضمن
   Roles، أو انشر التطبيق بعد استكمال متطلبات Meta. أضف
   `yqqedfjadgyktiohkuwg.supabase.co` أيضاً إلى App Domains عند طلب Meta ذلك.
6. (اختياري) إن اختلفت بيانات الربط: عدّل `SUPABASE_URL` و
   `SUPABASE_PUBLISHABLE_KEY` في `src/services/supabaseConfig.ts`.

هذا مشروع React Native وليس Next.js؛ لذلك لا نستخدم `@supabase/ssr` أو
`middleware`. تُحفظ الجلسة عبر `AsyncStorage` ويُستخدم رابط عميق لتدفق OAuth.

### الذكاء الاصطناعي المشترك

لا تضع مفتاح Gemini في `src/` أو في ملف APK أو بناء الويب: سيتمكن أي مستخدم من
استخراجه. تستدعي كل أدوات الذكاء الاصطناعي `supabase/functions/gemini` فقط، وتحفظ
الدالة المفتاح كسراً في Supabase وتفرض حدود الخطة على الخادم.

1. ألغِ أي مفتاح تمّت مشاركته، وأنشئ مفتاح Gemini جديداً من Google AI Studio.
2. سجّل الدخول واربط المشروع ثم طبّق migrations، ومنها
   `20260912_free_trial_ai_feature_limits.sql` و
   `20260913_ai_provider_routing_observability.sql`:
   ```bash
   npx supabase login
   npx supabase link --project-ref yqqedfjadgyktiohkuwg
   npx supabase db push
   ```
3. خزّن مفتاح Gemini دون إضافته إلى Git أو إلى أي ملف بالمشروع. أضف مفاتيح
   المزوّدين الآخرين قبل اختيار مساراتهم من مركز التحكم:
   ```bash
   npx supabase secrets set GEMINI_API_KEY="ضع-المفتاح-الجديد-هنا" --project-ref yqqedfjadgyktiohkuwg
   npx supabase secrets set DEEPSEEK_API_KEY="ضع-مفتاح-DeepSeek-هنا" --project-ref yqqedfjadgyktiohkuwg
   npx supabase secrets set OPENROUTER_API_KEY="ضع-مفتاح-OpenRouter-هنا" --project-ref yqqedfjadgyktiohkuwg
   npx supabase secrets set NVIDIA_NIM_API_KEY="nvapi-ضع-مفتاح-NVIDIA-هنا" --project-ref yqqedfjadgyktiohkuwg
     npx supabase functions deploy gemini --use-api --project-ref yqqedfjadgyktiohkuwg
     npx supabase functions deploy licenses --no-verify-jwt --use-api --project-ref yqqedfjadgyktiohkuwg
    ```

### تدوير مفاتيح مزوّدي AI من لوحة المالك

تستخدم المرحلة الثانية مساراً منفصلاً عن دالة التراخيص العامة. يبقى مفتاح
التشفير الجذري في Supabase Secrets، بينما لا يُخزَّن مفتاح Gemini أو DeepSeek
المدخل من اللوحة إلا مشفراً بـ AES-GCM. لا يمكن عرض المفتاح بعد حفظه.

1. طبّق migration المرحلة الثانية وانشر الدوال:

   ```bash
   npx supabase db push
   npx supabase functions deploy provider-keys --use-api --project-ref yqqedfjadgyktiohkuwg
   npx supabase functions deploy gemini --use-api --project-ref yqqedfjadgyktiohkuwg
   npx supabase functions deploy licenses --no-verify-jwt --use-api --project-ref yqqedfjadgyktiohkuwg
   ```

2. أنشئ مفتاح تشفير عشوائياً بطول 32 بايت بصيغة Base64URL، ثم خزّنه مرة واحدة
   فقط. لا تغيّره ما دامت هناك مفاتيح مزودين مدارة من اللوحة:

   ```bash
   npx supabase secrets set AI_PROVIDER_KEY_ENCRYPTION_KEY="BASE64URL_32_BYTE_SECRET" --project-ref yqqedfjadgyktiohkuwg
   ```

3. افتح **مركز تحكم AI → تدوير مفاتيح API**، فعّل TOTP لحساب المالك، ثم أدخل
   المفتاح الجديد. تختبره الدالة قبل الحفظ، وتشترط MFA حديثاً خلال خمس دقائق،
   وتسجل النتيجة دون تخزين السر أو إرجاعه.

4. تبقى `GEMINI_API_KEY` و`DEEPSEEK_API_KEY` و`OPENROUTER_API_KEY` و
   `NVIDIA_NIM_API_KEY` في Supabase Secrets كحل احتياطي قبل أول تدوير من اللوحة.
   بعد تدوير ناجح، ألغِ المفتاح السابق من حساب المزوّد نفسه.

تستخدم التجربة المجانية Flash وFlash-Lite للميزات الثلاث المحددة، بينما تستخدم
الخطة المفعلة `gemini-2.5-pro` فعلياً. تأكد من تفعيل Billing وتوفر Pro للمفتاح قبل
النشر. لم يعد السر `GEMINI_MODEL` مستخدماً في دالة Edge.

يوفر **مركز تحكم AI** في لوحة المالك توجيه المزوّد والنموذج، إيقاف المزوّد،
fallback مدفوع، اختبار اتصال آمن، ومراقبة التوكنات والتكلفة والأخطاء. لا يمكن حفظ
مسار لمزوّد لا يملك Secret مهيأً، ولا تظهر مفاتيح API في الواجهة. المزوّدون
المدعومون: Gemini (نص + صور)، DeepSeek (`deepseek-v4-pro`)، OpenRouter
(نص عبر `openai/gpt-4o-mini` و`anthropic/claude-3.5-haiku` وغيرها)، وNVIDIA NIM
(نص عبر `meta/llama-3.1-8b-instruct` و`meta/llama-3.3-70b-instruct` وغيرها).
تحقق من أسماء النماذج والتسعير المتاحين في حساب كل مزوّد قبل اختياره في الإنتاج،
وراجع أسعار OpenRouter/أرصدة NVIDIA في لوحاتهما لأن التسعير متغير ويبقى مالك
التسعير داخل `ai_system_config`/صفحة الاشتراكات. طبّق migration أولاً ثم انشر
دالتي `gemini` و`licenses` قبل تفعيل أي Route لمزوّد جديد.

تحذير تشغيلي: تجربة الضيف مرتبطة حالياً بـ `installationId`. لا تعامل التحقق
الافتراضي في Gateway وحده كهوية مؤكدة لمعلّم، لأن المفتاح العام للمشروع متاح داخل
التطبيق. قبل نشر الدالة بـ `--no-verify-jwt` أو التوسع في التجارب العامة، أضف
مصادقة مستخدم/ضيف مجهول حقيقية أو طبقة منع إساءة استخدام مستقلة.

### كيف تعمل المزامنة السحابية؟

- كل بيانات المعلم (الجدول، الخطط اليومية والسنوية، سجل الدرجات، المحرر،
  المكتبة) تُحفظ في جدول `teacher_data` مقيدة بحساب المستخدم (RLS).
- عند تسجيل الدخول بأي مزوّد: إن وُجدت بيانات في السحابة تُحمَّل على الجهاز
  (هذا ما يحدث عند استخدام جهاز ثانٍ بنفس الحساب)، وإن كانت السحابة فارغة
  تُرفع بيانات الجهاز الحالي.
- أي تعديل أثناء الجلسة يُدفع تلقائياً، وأي تغيير من جهاز آخر يصل لحظياً
  عبر Supabase Realtime.
- ملفات PDF والصور تبقى على الجهاز ولا تُنقل بين الأجهزة.
- حالة المزامنة + زر "مزامنة الآن" في **الإعدادات → المزامنة السحابية**.

## تحسينات عن النسخة الأصلية

- تنبيهات حصص فعلية (كانت بيانات ميتة في Flutter).
- توحيد منطق الأعمدة المحسوبة (كان متناقضاً) + طباعة القيم المحسوبة فعلاً.
- ترقية نموذج Gemini إلى 2.5-flash.
- دالة توزيع شهري نقية قابلة للاختبار.
- ألوان مواد ثابتة عبر الجلسات (FNV-1a بدل `String.hashCode`).
- إصلاح مسار المكتبة غير المسجل + إبراز اليوم الحالي + تنفيذ إطار الورقة في PDF.
- تحقق من كل البيانات الخارجية بـ Zod.

## قيود معروفة / أعمال مستقبلية

- **استخراج نص PDF محلياً**: لم يُنفَّذ بعد (يتطلب WebView + pdf.js)؛ التوليد يعتمد حالياً على المعرفة العامة للنموذج عند عدم وجود استخراج.
- **Supabase**: يتطلب الجدول من `supabase/schema.sql` + تفعيل مزوّد Google أو Facebook + إضافة روابط العودة كما هو موضح أعلاه (بدونها يعمل الوضع المحلي فقط).
- **الويب**: يعمل Google وFacebook على `localhost:5174` بعد إضافة `http://localhost:5174/auth/callback` إلى قائمة Redirect URLs في Supabase.
- معرّفات Google Drive للمناهج متاحة حالياً للصف السادس (علمي/أدبي) فقط؛ باقي الصفوف فارغة.

## نشر الويب والتحديثات الفورية

الويب ينشر من جذر المستودع على Vercel: `npm run web:build` (مضبوط في `vercel.json`)
ويخرج إلى `dist-web/`. بعد كل `push` على `main` يُبنى الموقع وينشر تلقائياً.

آلية التحديث على الويب مكافئة لآلية تطبيق الهاتف (`src/services/otaUpdateService.ts`):

1. بناء Vite يكتب `version.json` (`version` + `buildId` = commit المنشور) ويحقن
   نفس `buildId` داخل الحزمة باسم `__WEB_BUILD_ID__`.
2. التطبيق يفحص `version.json` بلا تخزين مؤقت عند الإقلاع، وعند عودة الصفحة،
   وكل خمس دقائق أثناء بقائها مفتوحة.
3. إذا اختلف `buildId` المنشور عن المعرّف الذي تعمل عليه الحزمة الحالية، يظهر
   زر التحديث العائم نفسه (نفس نافذة تطبيق الهاتف).
4. عند التطبيق: يُلغى تسجيل الـ service workers، وتُحذف كل ذاكرات التخزين المؤقت،
   ثم تُعاد تحميل الصفحة فيعمل المتصفح على آخر بناء.

`web/public/sw.js` يخدم `index.html` بشبكة أولاً (network-first) ولا يخزّنه مسبقاً،
واسم ذاكرة التخزين يحمل `buildId` فتحذف أصول النشر السابق تلقائياً؛ لذلك لا يبقى
المتصفح على نسخة قديمة بعد النشر.

## الاختبارات

اختبارات وحدة للمنطق النقي في `__tests__/domain.test.ts`: حساب سجل الدرجات، التوزيع الشهري، التجزئة، والتواريخ.
