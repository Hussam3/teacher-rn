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
استخراجه. يستدعي التطبيق `supabase/functions/gemini`، وتحفظ الدالة المفتاح كسراً
في Supabase وتطلب حساباً مسجلاً للحد من إساءة الاستخدام.

1. ألغِ أي مفتاح تمّت مشاركته، وأنشئ مفتاح Gemini جديداً من Google AI Studio.
2. من سطر الأوامر، سجّل الدخول إلى Supabase ثم خزّن المفتاح الجديد محلياً في
   الأمر التالي، دون إضافته إلى Git أو إلى أي ملف بالمشروع:
   ```bash
   npx supabase login
   npx supabase secrets set GEMINI_API_KEY="ضع-المفتاح-الجديد-هنا" GEMINI_MODEL="gemini-2.5-flash" --project-ref yqqedfjadgyktiohkuwg
   ```
3. انشر الدالة:
   ```bash
   npx supabase functions deploy gemini --project-ref yqqedfjadgyktiohkuwg
   ```

الدالة تفرض حالياً 30 طلباً لكل حساب مسجّل في الساعة، ولا تخزّن نصوص الطلبات أو
الصور. يمكن تغيير النموذج من السر `GEMINI_MODEL` أو الحد من `MAX_REQUESTS_PER_HOUR`
داخل الدالة.

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

## الاختبارات

اختبارات وحدة للمنطق النقي في `__tests__/domain.test.ts`: حساب سجل الدرجات، التوزيع الشهري، التجزئة، والتواريخ.
