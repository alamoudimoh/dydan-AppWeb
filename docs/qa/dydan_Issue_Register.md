# dydan — Master Issue Register

> **الملف الوحيد المعتمد لملاحظات المستخدم وحالة الإصلاحات الخاصة بـ dydan.**
> **المسؤول عن التحرير والمراجعة والإغلاق:** ChatGPT (Planner) بالتوجيه المباشر من المستخدم؛ وليس أي CLI Agent.
> **آخر تحديث:** 2026-10-10 · **المسار:** docs/qa/dydan_Issue_Register.md
> **آخر فرع تم اعتماده لهذا التحديث:** fix/05-global-page-ui-system · **Implementation commit المُراجع:** 6cf43dad50fe93c647a17e1219e02545f409f6a0 · **Baseline:** 1aa1635fc93cf6bcd0801ce202935e141e5fa3e0

## 1. حدود السجل ودقة الأدلة

- هذا سجل **14 بندًا** يجمع بلاغات المستخدم، ملاحظات UI/UX، إصلاحات أُنجزت، وبنودًا تحتاج تحققًا. لا يجوز تحويل ملاحظة غير متحققة إلى Bug تقني مؤكد.
- **Open:** ملاحظة/خلل قائم أو مطلب إصلاح لم يصلنا دليل إغلاقه بعد.
- **Needs Verification:** توجد قرائن أو تنفيذ جزئي، لكن يلزم إثبات فعلي قبل الإغلاق.
- **Closed:** أُغلق النطاق بدليل تنفيذ/اختبار/تقرير واضح ومذكور في البند.
- نجاح Unit/Smoke Tests وحده لا يكفي لإغلاق عيب بصري إذا كان القبول يعتمد على الشكل الفعلي في المتصفح.
- هذا الملف **يُدار حصريًا في هذه المحادثة عبر ChatGPT Planner**. لا يُكلّف CLI Agent بقراءته أو تحديثه أو إدارة حالاته. مخرجات الـCLI الفنية تُراجع هنا أولًا ثم تُستخدم كدليل.
- ملف `docs/design/dydan-ui-foundation.md` هو **معيار تصميم منفصل** وليس سجل مشاكل. وجوده لا يغني عن هذا السجل.
- لا تعديل لكود التطبيق أو الباك إند بسبب تحديث هذا السجل وحده.

## 2. نطاق الملاحظات المؤكدة حاليًا

- تم تنفيذ Fix 01 ثم Fix 02 ثم Fix 03 مع تقارير موثقة من المستخدم.
- تنفيذ Shopping المقصود في Fix 04 موجود على baseline الذي دخل Fix 05، وFix 05 حافظ عليه وأضاف PageTabs/EmptyState/PageShell المشتركة. راجعت commit `6cf43dad50fe93c647a17e1219e02545f409f6a0` وتأكدت أن parent هو `1aa1635fc93cf6bcd0801ce202935e141e5fa3e0` وأن التغيير يشمل 37 ملفًا. رغم ذلك، إغلاق الملاحظات البصرية ينتظر فحصًا فعليًا للواجهة، وتشخيص الـBackend لا يُغلق باختبارات API mocked.
- التسمية الظاهرة `Maintenance → Assets` و`Things → Trackers` نُفذت في الواجهة ضمن Fix 03، لكن تقرير التنفيذ نفسه ذكر بقاء `/maintenance` و`/things` وبعض hooks/screen identifiers والـAPIs القديمة داخليًا؛ لذلك الهجرة ليست End-to-End بعد.
- Fix 05 أنشأ Global Page UI System فعليًا: `PageShell`, `PageTabs`, `FilterSegment`, `EmptyState`, `PageHero`, `PageSection`, `EntityCard/EntityGrid/EntityList` مع tokens مركزية في `src/index.css`. المصدر يثبت migration واسعًا للصفحات، لكن القبول البصري النهائي ما زال يحتاج مراجعة فعلية؛ كما أن بوابة الاختبار البنيوية الحالية لا تشمل كل الشاشات التي ذكرها تقرير التنفيذ (مثل Activity/Notifications/Search) ضمن قائمة `PRIMARY_SHELL`.
- خدمة `dydan-web.service` شُخّصت بأنها ماتت وبقيت dead بسبب `Restart=on-failure`، مع عدم وجود listener على 2925. تم تحديد الإصلاح الدائم المقترح، لكن لا يوجد في هذه المحادثة بعد دليل تنفيذ/تحقق نهائي بعد التعديل.

## 3. الجدول الرئيسي

| ID | التصنيف | النوع | الملاحظة | الأولوية | الحالة | الدليل/المرجع |
|---|---|---|---|---|---|---|
| [DYD-001](#dyd-001) | UI/UX | خلل بصري مؤكد | اختلاف موضع عنوان الصفحة عند التنقل بين الصفحات | P1 | **Closed** | Fix 02 — commit da17d4629997f32fc873edb9e8b541f893fdf54a |
| [DYD-002](#dyd-002) | UI/UX | خلل تفاعل مؤكد | Maintenance كان يعرض نماذج الإنشاء inline بدل modal موحد | P1 | **Closed** | Fix 02 — commit da17d4629997f32fc873edb9e8b541f893fdf54a |
| [DYD-003](#dyd-003) | UI/UX Architecture | خلل نظام تصميم | Task / Project / Routine / Asset / Meter / Tracker / Shopping كانت تستخدم أنماط إنشاء مختلفة | P1 | **Closed** | Fix 03 — commit 640fe0bb01c445ad4b24ed63441f3c258d5d524e |
| [DYD-004](#dyd-004) | UI/UX Architecture | مطلب نظام | Universal + كنقطة بدء موحدة للإنشاء | P1 | **Closed** | Fix 03 — selector موحد ومركزي |
| [DYD-005](#dyd-005) | Domain / Backend | هجرة غير مكتملة | Assets/Trackers ظاهريًا بينما Maintenance/Things ما زالت موجودة داخليًا | P1 | **Open** | تقرير Fix 03 نفسه |
| [DYD-006](#dyd-006) | UI/UX | خلل بصري/هيكلي مؤكد | Shopping layout/hierarchy غير منظم ومختلف عن Assets | P1 | **Needs Verification** | Fix 04 behavior + Fix 05 shared PageTabs/PageShell؛ يحتاج قبول بصري فعلي |
| [DYD-007](#dyd-007) | Frontend / Backend | تشخيص بيانات | احتمال وجود خلل Shopping في API/data flow بعد إصلاح الواجهة | P1 | **Needs Verification** | المطلوب في Fix 04 |
| [DYD-008](#dyd-008) | UI/UX Architecture | خلل Global Standard | اختلاف tabs / empty states / cards / hero / spacing عبر جميع الصفحات | P1 | **Needs Verification** | Fix 05 — commit 6cf43dad50fe93c647a17e1219e02545f409f6a0؛ التطبيق موجود ويحتاج قبول بصري/اكتمال gate |
| [DYD-009](#dyd-009) | Frontend | خلل سابق | Greeting كان hardcoded بدل time-aware/localized | P2 | **Closed** | Fix 01 — commit 859d50492c18ce43198c4b64714a79233599982d |
| [DYD-010](#dyd-010) | Localization | خلل سابق | Language selector وRTL/LTR labels غير منضبطة | P2 | **Closed** | Fix 01 — commit 859d50492c18ce43198c4b64714a79233599982d |
| [DYD-011](#dyd-011) | Theme / UI | خلل سابق | Search placeholder/border/text tokens غير متسقة بين الثيمات | P2 | **Closed** | Fix 01 — commit 859d50492c18ce43198c4b64714a79233599982d |
| [DYD-012](#dyd-012) | Terminology | خلل سابق | Join code كان يظهر بدل dydan code | P3 | **Closed** | Fix 01 — commit 859d50492c18ce43198c4b64714a79233599982d |
| [DYD-013](#dyd-013) | Infrastructure | خلل تشغيل مؤكد | dydan-web.service يتوقف ولا يعود تلقائيًا؛ 2925 يصبح connection refused | P1 | **Open** | تشخيص 2026-10-10؛ Restart=on-failure + service dead |
| [DYD-014](#dyd-014) | UI/UX | خلل سابق محدود | Shopping list buttons/content wrapping كان فيه alignment issue | P2 | **Closed** | Fix 01 — commit 859d50492c18ce43198c4b64714a79233599982d |

**ملخص الحالات:** Open: 2 · Needs Verification: 3 · Closed: 9 · **الإجمالي: 14**

## 4. تفاصيل البنود

### DYD-001 — اختلاف موضع عنوان الصفحة عند التنقل

- **التصنيف / النوع / الأولوية / الحالة:** UI/UX · خلل بصري مؤكد · P1 · Closed
- **المصدر:** screenshots وملاحظة المستخدم بعد Fix 01.
- **الوصف:** Fix 01 قاس `first-child` واعتبر الصفحات متطابقة، لكن بصريًا كان عنوان Today منخفضًا عن All Tasks وMaintenance لأن eyebrow/date كان يدفع العنوان لأسفل.
- **السلوك المطلوب:** الـprimary page title يجب أن يبقى على نفس الـvisual anchor بين الصفحات عند نفس viewport/zoom.
- **الإغلاق:** Fix 02 أنشأ `PageHeader.tsx` بعقد موحد مع eyebrow slot محجوز، وذكر تقرير التنفيذ أن العناوين المقاسة كانت 107px desktop و103.5px mobile دون variance عبر الصفحات المختبرة.
- **الدليل:** commit `da17d4629997f32fc873edb9e8b541f893fdf54a`.
- **حدود الإغلاق:** هذا يغلق page-title anchor فقط، ولا يغلق DYD-008 الخاص ببقية page system.

### DYD-002 — Maintenance creation forms كانت inline

- **التصنيف / النوع / الأولوية / الحالة:** UI/UX · خلل تفاعل مؤكد · P1 · Closed
- **المصدر:** ملاحظة المستخدم: Asset/Meter/Thing تظهر نماذجها مباشرة بدل فتح popup.
- **السلوك المطلوب:** Create Asset / Meter / Thing تفتح dialog بنفس interaction family بدل form دائم داخل الصفحة.
- **الإغلاق:** Fix 02 نقل Asset/Meter/Thing إلى `FormModal` وأزال النماذج inline.
- **الدليل:** commit `da17d4629997f32fc873edb9e8b541f893fdf54a`.
- **حدود الإغلاق:** شكل الإنشاء العام تم توحيده لاحقًا بشكل أوسع في DYD-003.

### DYD-003 — اختلاف أنماط الإنشاء بين الكيانات

- **التصنيف / النوع / الأولوية / الحالة:** UI/UX Architecture · خلل نظام تصميم · P1 · Closed
- **المصدر:** ملاحظة المستخدم أن Project/Routine/Task/Maintenance/Shopping كل واحد يفتح بطريقة مختلفة.
- **السلوك المطلوب:** كل Create/Add في dydan يستخدم نفس modal shell والمقاسات والـheader/footer والـresponsive والـRTL، مع اختلاف الحقول فقط.
- **الإغلاق:** Fix 03 أنشأ النظام المركزي عبر `FormModal.tsx` + `CreateEntityModal.tsx` + `entityConfigs.tsx` + shared fields.
- **النطاق المغلق:** Task, Project, Routine, Asset, Meter, Tracker, Shopping List, Shopping Item، إضافة إلى Goal/Reward/Category بحسب تقرير التنفيذ.
- **الدليل:** commit `640fe0bb01c445ad4b24ed63441f3c258d5d524e`.

### DYD-004 — Universal + كنقطة بدء موحدة

- **التصنيف / النوع / الأولوية / الحالة:** UI/UX Architecture · مطلب نظام · P1 · Closed
- **المصدر:** المستخدم أكد أن زر + العلوي هو starting point الموحد.
- **السلوك المطلوب:** + يفتح selector واحد؛ الخيارات العليا: Task / Project / Routine / Asset / Shopping List؛ contextual actions تتجاوز selector لكنها تستخدم نفس create configuration.
- **الإغلاق:** تقرير Fix 03 أكد تنفيذ selector مركزي بنفس الأيقونات ونفس modal configurations.
- **الدليل:** commit `640fe0bb01c445ad4b24ed63441f3c258d5d524e`.

### DYD-005 — Assets/Trackers هجرة Frontend فقط

- **التصنيف / النوع / الأولوية / الحالة:** Domain / Backend · هجرة غير مكتملة · P1 · Open
- **المصدر:** تقرير Fix 03 + اعتراض المستخدم على الاكتفاء بـ frontend rename.
- **الوصف:** الواجهة أصبحت Assets / Meters / Trackers، لكن التقرير ذكر صراحة بقاء `/maintenance` وscreen identifiers/hooks و`/things` APIs داخليًا للتوافق.
- **السلوك المطلوب:** تحديد واعتماد domain naming الحقيقي End-to-End. إذا كانت Assets/Trackers هي المصطلحات النهائية، يجب وضع خطة migration واضحة للroutes/types/hooks/services/API contracts/persistence مع compatibility aliases مؤقتة فقط إذا لزم.
- **معايير القبول:** لا يبقى legacy naming دائمًا بدون سبب موثق؛ أي alias مؤقت له نطاق وإزالة واضحة؛ البيانات الحالية لا تضيع.
- **حدود الإثبات:** لم يُطلب بعد تنفيذ Backend migration فعلي، لذلك البند مفتوح.

### DYD-006 — Shopping layout/hierarchy غير منظم

- **التصنيف / النوع / الأولوية / الحالة:** UI/UX · خلل بصري/هيكلي مؤكد · P1 · Needs Verification
- **المصدر:** screenshots وملاحظات المستخدم.
- **الوصف:** Shopping كانت تعرض CTA مكرر، empty state منفصل بصريًا، sharing block كبير، وبنية لا تتبع نفس discipline الموجودة في Assets.
- **السلوك المطلوب:** Shopping يتبع نفس page pattern العام، بثلاثة tabs: **Shopping Lists / Items / Overview**.
- **قواعد المحتوى:** Shopping Lists للقوائم، Items لكل العناصر مع parent list context، Overview يجمع كل list مع items التابعة لها. sharing يبقى secondary.
- **معايير القبول:** زر واحد `New Shopping List` في header؛ لا duplicate CTA في empty state؛ tabs تستخدم shared pattern؛ responsive + RTL/LTR.
- **دليل التنفيذ الحالي:** Fix 05 commit `6cf43dad50fe93c647a17e1219e02545f409f6a0` يحتوي Shopping على `PageShell` و`PageTabs` المشتركة، ويحافظ على Lists/Items/Overview، وملف `e2e/fix04-shopping-layout-diagnostics.spec.js` يتحقق من CTA واحد، parent-list context، Overview grouping، وفصل API failure عن empty state.
- **حدود الإثبات:** اختبارات Shopping تستخدم API mocks، والـPlanner لم يفحص حتى الآن render فعليًا في المتصفح بعد Fix 05؛ لذلك لا أُغلق الملاحظة البصرية بمجرد تقرير الـCLI.

### DYD-007 — احتمال خلل Backend/Data Flow في Shopping

- **التصنيف / النوع / الأولوية / الحالة:** Frontend / Backend · تشخيص بيانات · P1 · Needs Verification
- **المصدر:** المستخدم ذكر أن Shopping فيها خلل واضح وقد يكون backend، وطلب إصلاح frontend أولًا ثم التشخيص.
- **السلوك المطلوب:** بعد تصحيح UI يتم تتبع المسار الحقيقي: UI → state/hooks → API client → endpoint → response → persistence → refresh → list/item relation.
- **معايير القبول:** create list، refresh، create item، refresh، إثبات parent relationship؛ ثم تصنيف الخلل بدليل كـ FRONTEND / API CLIENT / BACKEND/API / PERSISTENCE / NONE.
- **دليل التنفيذ الحالي:** اختبارات Fix 04 الموجودة على فرع Fix 05 تثبت عقد الـfrontend/client مع mock routes وتتحقق من create list → create item → reload → parent context، كما تتحقق من أن 503 لا يتحول إلى empty state.
- **حدود الإثبات:** هذه الاختبارات **mocked** وليست اتصالًا بالـBackend الحقيقي. لذلك تقرير الـCLI «لا يوجد backend defect» يعني فقط أنه لم يثبت defect؛ ولا يثبت سلامة الـBackend/persistence الفعلي. يبقى البند Needs Verification حتى اختبار live API/data persistence.

### DYD-008 — Global Page UI Standard غير مطبق عبر كل الصفحات

- **التصنيف / النوع / الأولوية / الحالة:** UI/UX Architecture · خلل Global Standard · P1 · Needs Verification
- **المصدر:** screenshots وملاحظات المستخدم بتاريخ 2026-10-10.
- **الوصف:** الاختلاف ليس في ست صفحات فقط. Home, Today, All Tasks, Calendar, Projects, Routines, Assets, Shopping, Goals, Rewards وغيرها تستخدم spacing/tabs/empty states/card geometry/hero sizes/content start positions مختلفة.
- **السلوك المطلوب:** Global Page Shell واحد + shared page primitives، بحيث أي صفحة مستقبلية ترث نفس القواعد بدل إضافة CSS خاص.
- **المكونات المطلوب توحيدها:** PageShell, PageHeader, PageTabs, PageHero, PageSection, EntityCard/row variants, EmptyState, filters/segmented controls، مع spacing/gutters/radii/responsive/RTL ثابتة.
- **معايير القبول:** نفس الـvisual anchors والمقاسات لأنماط UI المتشابهة على desktop/mobile وLTR/RTL، مع اختبار يمنع إنشاء custom tab/empty-state/page geometry بلا shared source.
- **مرجع التصميم المنفصل:** `docs/design/dydan-ui-foundation.md`.
- **دليل التنفيذ الحالي:** Fix 05 commit `6cf43dad50fe93c647a17e1219e02545f409f6a0` أنشأ shared page primitives والتوكنز المركزية، وهاجر 16 screen source files. راجعت فعليًا `PageShell`, `PageTabs`, `FilterSegment`, `EmptyState`, `PageHero`, `PageSection`, `EntityCard` واختبارات `pageSystem.spec.tsx` و`fix05-global-page-geometry.spec.js`.
- **نتائج التقرير المقبولة كدليل تنفيذ:** title anchor 107px desktop و103.5px mobile على مجموعة الاختبار؛ PageTabs بارتفاع موحد؛ RTL/LTR وmobile overflow gates؛ create system لم يتغير.
- **ملاحظة Planner:** تقرير التنفيذ يقول إن Activity/Notifications/Search هاجرت، والمصدر يؤكد وجود `PageShell` فيها، لكن قائمة `PRIMARY_SHELL` في `pageSystem.spec.tsx` لا تشمل Activity/Notifications/Search، كما أن E2E geometry يغطي 12 route فقط. لذلك enforcement ليس شاملًا لكل ما وُصف بأنه primary page بعد.
- **ملاحظة responsive:** اختلاف top للـtabs على mobile بسبب wrapping للعنوان/الإجراء/النص قد يكون سلوكًا صحيحًا لأنه ناتج من نفس القاعدة المشتركة، وليس بالضرورة inconsistency. القبول النهائي يكون بصريًا لا بمجرد أرقام التقرير.
- **حدود الإثبات:** لا يُغلق البند حتى مراجعة render الفعلي من المستخدم/Planner وإما قبول هذه الفروقات أو طلب ضبط إضافي، مع استكمال test gate إن اعتُبرت Activity/Notifications/Search ضمن primary routes.

### DYD-009 — Greeting hardcoded

- **التصنيف / النوع / الأولوية / الحالة:** Frontend · خلل سابق · P2 · Closed
- **المصدر:** تقرير Fix 01.
- **الوصف:** `Good morning` كان hardcoded.
- **الإغلاق:** utility تعتمد `Date#getHours()` مع morning/afternoon/evening localization وتحديث كل دقيقة.
- **الدليل:** commit `859d50492c18ce43198c4b64714a79233599982d`.

### DYD-010 — Language selector وRTL/LTR labels

- **التصنيف / النوع / الأولوية / الحالة:** Localization · خلل سابق · P2 · Closed
- **المصدر:** تقرير Fix 01.
- **الإغلاق:** selector أصبح English والعربية فقط، labels بدون `(RTL)/(LTR)`، وإزالة user-facing layout toggle مع بقاء `dir` behavior.
- **الدليل:** commit `859d50492c18ce43198c4b64714a79233599982d`.

### DYD-011 — Search theme tokens

- **التصنيف / النوع / الأولوية / الحالة:** Theme / UI · خلل سابق · P2 · Closed
- **المصدر:** تقرير Fix 01.
- **الوصف:** search placeholder/text/border لم تكن تعتمد shared tokens كاملة، وSovereign dark كان ناقصًا.
- **الإغلاق:** إضافة `--search-text`, `--search-placeholder`, `--search-border` واختبارات contrast.
- **الدليل:** commit `859d50492c18ce43198c4b64714a79233599982d`.

### DYD-012 — Join code terminology

- **التصنيف / النوع / الأولوية / الحالة:** Terminology · خلل سابق · P3 · Closed
- **المصدر:** تقرير Fix 01.
- **الإغلاق:** user-facing Join code / Regenerate join code / New join code تغيّرت إلى dydan code variants دون API/identifier renames.
- **الدليل:** commit `859d50492c18ce43198c4b64714a79233599982d`.

### DYD-013 — dydan-web.service يموت ولا يعود

- **التصنيف / النوع / الأولوية / الحالة:** Infrastructure · خلل تشغيل مؤكد · P1 · Open
- **المصدر:** تشخيص مباشر بتاريخ 2026-10-10.
- **الوصف:** `dydan-web.service` كان `inactive (dead)` منذ Oct 09 08:11، لا listener على 2925، وcurl على localhost وLAN يرجع connection refused.
- **السبب المؤكد:** `Restart=on-failure` لا يعيد الخدمة بعد TERM/clean stop؛ Vite نفسه كان مضبوطًا على LAN bind عندما يكون شغالًا.
- **الإصلاح المقترح:** systemd service/override يعمل كـ`developer`، `--host 0.0.0.0 --port 2925 --strictPort`, `Restart=always`, `RestartSec=3`, enable at boot، مع HMR محفوظ.
- **معايير القبول:** `enabled + active`، listener على `0.0.0.0:2925` أو wildcard مناسب، localhost/LAN HTTP نجاح، browser render، HMR بدون service restart، restart persistence.
- **حدود الإثبات:** أوامر الإصلاح تم تجهيزها للمستخدم، لكن لم يصل بعد output نهائي يثبت التنفيذ؛ لذلك البند يبقى Open.

### DYD-014 — Shopping wrapping/alignment السابق

- **التصنيف / النوع / الأولوية / الحالة:** UI/UX · خلل سابق محدود · P2 · Closed
- **المصدر:** تقرير Fix 01.
- **الوصف:** buttons/list content في Shopping احتاجت shared card/min-width/header wrapping لتحسين desktop/mobile.
- **الإغلاق:** Fix 01 نفذ هذا النطاق المحدود.
- **الدليل:** commit `859d50492c18ce43198c4b64714a79233599982d`.
- **حدود الإغلاق:** لا يغلق DYD-006؛ المشكلة الحالية أوسع وتشمل hierarchy/tabs/empty state/sharing/content presentation.

## 5. ملكية الملف والتحديث

1. هذا هو سجل المشاكل والحالة المعتمد لـ dydan؛ `docs/design/dydan-ui-foundation.md` يبقى ملف معيار تصميم منفصل.
2. الإضافة أو تغيير الحالة تتم فقط بتوجيه المستخدم أو بنتيجة موثقة أراجعها أنا كـ Planner.
3. عند إغلاق بند يجب ذكر نطاق الإغلاق وCommit/اختبار/إفادة المستخدم. لا أعتبر نجاح الاختبارات الآلية وحده إثباتًا لإغلاق عيب بصري غير مفحوص فعليًا.
4. أُحدّث الجدول والتفاصيل وملخص الأعداد معًا، وأحافظ على ID ثابت لكل بند.
5. CLI Agents لا يقرأون هذا السجل ولا يعدلونه ولا يقررون حالاته. عند الحاجة لتنفيذ Fix، يُنسخ لهم فقط نطاق العمل المطلوب في البرومبت.
6. أي مشكلة جديدة تظهر لاحقًا تُضاف هنا أولًا أو بالتوازي مع تجهيز البرومبت، حتى يبقى واضحًا ما تم وما لم يتم.
