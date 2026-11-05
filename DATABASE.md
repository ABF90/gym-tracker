# توثيق قاعدة بيانات Gym Tracker

## ١. نظرة عامة على المشروع

**Gym Tracker** مشروع لتسجيل التمارين الرياضية ومتابعة التقدّم مع الوقت.

قاعدة البيانات تحفظ كل تمرين تقوم به، سواء كان:
- **تمرين مقاومة (resistance):** مثل رفع الأوزان، ويُسجَّل فيه رقم المجموعة وعدد التكرارات والوزن.
- **تمرين كارديو (cardio):** مثل الدراجة الثابتة أو جهاز المشي، ويُسجَّل فيه المدة والمسافة.

الهدف أن تستطيع لاحقاً معرفة أشياء مثل: أثقل وزن رفعته، ومجموع تكراراتك في يوم معيّن، وتطوّرك مع الوقت.

قاعدة البيانات فيها حالياً **أربعة جداول** وحاوية صور واحدة:
- `workouts`: سجل كل التمارين.
- `workout_sessions`: جلسة تمرين كاملة، يستخدمها تطبيق الويب. تفاصيلها في القسم ١٩.
- `personal_records`: أفضل أداء شخصي في تمارين المقاومة. تفاصيله في القسم ١٢ والقسم ١٩.
- `exercises`: مكتبة التمارين، فيها كل تمرين مرة واحدة مع مسار صورته. تفاصيله في القسم ١٦.
- حاوية الصور `exercise-images` في Supabase Storage. تفاصيلها في القسم ١٦.

> 🔐 **منذ إطلاق تطبيق الويب:** كل صف له مالك (`user_id`)، وكل مستخدم يرى بياناته فقط. التفاصيل في القسم ١٩.

---

## ٢. معلومات مشروع Supabase

| المعلومة | القيمة |
|---|---|
| اسم المشروع | `gym-tracker` |
| رقم المشروع (Project ID) | `jdhgmdxgjrfdezrteigl` |
| المنطقة | `eu-west-1` (أيرلندا) |
| قاعدة البيانات | PostgreSQL 17 |

> ⚠️ **تنبيه أمني:** لا تكتب أبداً في هذا الملف، ولا في أي ملف داخل المشروع، كلمة مرور قاعدة البيانات أو مفاتيح API. هذا الملف سيُرفع إلى GitHub.

---

## ٣. الجدول الأول: workouts

اسم الجدول: **`public.workouts`**

- `public` هو اسم المجموعة (schema) التي يوجد فيها الجدول.
- `workouts` هو اسم الجدول نفسه.

---

## ٤. الأعمدة الـ 15

| # | العمود | النوع في PostgreSQL | إلزامي؟ | الغرض |
|---|---|---|---|---|
| 1 | `id` | `uuid` | نعم (تلقائي) | رقم تعريف فريد لكل صف، يتولّد تلقائياً. وهو المفتاح الأساسي (primary key). |
| 2 | `workout_date` | `date` | نعم | تاريخ التمرين. إذا لم يُكتب يوضع تاريخ اليوم تلقائياً. |
| 3 | `exercise_type` | `text` | نعم | نوع التمرين: `resistance` أو `cardio` فقط. |
| 4 | `exercise_name` | `text` | نعم | اسم التمرين، مثل `Dumbbell Biceps Curl` أو `Treadmill`. |
| 5 | `set_number` | `integer` | اختياري* | رقم المجموعة (للمقاومة فقط). |
| 6 | `reps` | `integer` | اختياري* | عدد التكرارات (للمقاومة فقط). |
| 7 | `weight_kg` | `numeric` | اختياري | الوزن بالكيلوغرام (للمقاومة فقط). |
| 8 | `duration_minutes` | `numeric` | اختياري* | مدة الجلسة بالدقائق (للكارديو فقط). |
| 9 | `distance_km` | `numeric` | اختياري | المسافة بالكيلومتر (للكارديو فقط). |
| 10 | `notes` | `text` | اختياري | ملاحظات حرّة. |
| 11 | `created_at` | `timestamptz` | نعم (تلقائي) | وقت إضافة الصف، يُسجَّل تلقائياً. |
| 12 | `effort_level` | `integer` | اختياري | مدى صعوبة التمرين كما شعرت به، من 1 إلى 10. أُضيف لاحقاً، انظر القسم ١٥. |
| 13 | `exercise_id` | `uuid` | اختياري | رقم التمرين في جدول `exercises`. أُضيف لاحقاً، انظر القسم ١٦. |
| 14 | `user_id` | `uuid` | نعم | صاحب الصف (حساب Supabase Auth). أُضيف لاحقاً، انظر القسم ١٩. |
| 15 | `session_id` | `uuid` | اختياري | الجلسة التي تنتمي لها المجموعة. فارغ للصفوف القديمة. أُضيف لاحقاً، انظر القسم ١٩. |

\* هذه الأعمدة اختيارية في الجدول بشكل عام، لكنها **تصبح إلزامية** حسب نوع التمرين. التفاصيل في قسم قواعد التحقق.

---

## ٥. ماذا يمثّل كل صف؟

### تمرين المقاومة: كل صف = مجموعة (set) واحدة
إذا لعبت 3 مجموعات من تمرين واحد، تُسجَّل **3 صفوف**، كل صف فيه رقم المجموعة وعدد التكرارات والوزن.

مثال: 3 مجموعات من Dumbbell Biceps Curl = 3 صفوف.

### تمرين الكارديو: كل صف = جلسة واحدة
إذا مشيت 30 دقيقة على جهاز المشي، يُسجَّل **صف واحد** فيه المدة، والمسافة إن أردت.

أمثلة على تمارين الكارديو:
- Stationary Bike (الدراجة الثابتة)
- Treadmill (جهاز المشي)
- Elliptical (جهاز الإليبتيكال)
- Swimming (السباحة)

أسماء التمارين **غير مقيّدة بقائمة ثابتة**، فتستطيع إضافة أي تمرين جديد مستقبلاً.

---

## ٦. قواعد التحقق، والفهارس، والحماية

### قواعد التحقق (Constraints)
هذه القواعد موجودة داخل قاعدة البيانات نفسها، فترفض أي بيانات خاطئة تلقائياً:

| اسم القاعدة | ماذا تفعل؟ |
|---|---|
| `workouts_exercise_type_check` | نوع التمرين يجب أن يكون `resistance` أو `cardio` فقط. |
| `workouts_exercise_name_not_blank` | اسم التمرين لا يمكن أن يكون فارغاً أو مسافات فقط. |
| `workouts_resistance_rules` | في تمارين المقاومة: `set_number` و `reps` إلزاميان وأكبر من صفر. `weight_kg` اختياري ولا يكون سالباً. `duration_minutes` و `distance_km` يجب أن يكونا فارغين (NULL). |
| `workouts_cardio_rules` | في الكارديو: `duration_minutes` إلزامي وأكبر من صفر. `distance_km` اختياري ولا يكون سالباً. `set_number` و `reps` و `weight_kg` يجب أن تكون فارغة (NULL). |
| `workouts_effort_level_range` | `effort_level` يكون من 1 إلى 10، أو فارغاً (NULL). أُضيفت لاحقاً، انظر القسم ١٥. |
| `workouts_exercise_fk` | `exercise_id` يجب أن يشير إلى تمرين موجود في `exercises` **من النوع نفسه**. أُضيفت لاحقاً، انظر القسم ١٦. |

### الفهارس (Indexes)
الفهرس يشبه فهرس الكتاب، يجعل البحث أسرع بكثير:

| اسم الفهرس | الأعمدة | الفائدة |
|---|---|---|
| `workouts_workout_date_idx` | `workout_date` | البحث حسب التاريخ. |
| `workouts_type_date_idx` | `exercise_type`, `workout_date` | البحث حسب النوع (مقاومة/كارديو) مع التاريخ. |
| `workouts_name_date_idx` | `exercise_name`, `workout_date` | البحث حسب اسم التمرين مع التاريخ. |
| `workouts_exercise_id_idx` | `exercise_id` | البحث السريع حسب التمرين المرتبط. أُضيف لاحقاً، انظر القسم ١٦. |

بالإضافة إلى فهرس المفتاح الأساسي `workouts_pkey` الذي تنشئه قاعدة البيانات تلقائياً.

### الحماية (Row Level Security - RLS)
- **RLS مفعّلة** على الجدول.
- لا توجد قواعد وصول (policies) حتى الآن، لذلك لا يستطيع أي موقع أو تطبيق قراءة البيانات أو تعديلها عبر الإنترنت.
- صاحب المشروع يستطيع دائماً رؤية البيانات من لوحة Supabase.
- عندما نبني التطبيق سنضيف قواعد وصول تحدد من يستطيع القراءة والكتابة.

### ملاحظة عن التوقيت
قاعدة البيانات تستخدم توقيت غرينتش (UTC). لذلك:
- `created_at` قد يظهر بتاريخ مختلف عن تاريخك المحلي.
- القيمة التلقائية لعمود `workout_date` قد تكون **اليوم السابق** إذا أضفت تمريناً بعد منتصف الليل بتوقيتك.
- **الحل:** اكتب `workout_date` دائماً بنفسك.

---

## ٧. أمر إنشاء الجدول (CREATE TABLE)

هذا هو الأمر الذي أنشأ الجدول:

```sql
create table public.workouts (
  id               uuid        primary key default gen_random_uuid(),
  workout_date     date        not null default current_date,
  exercise_type    text        not null,
  exercise_name    text        not null,
  set_number       integer,
  reps             integer,
  weight_kg        numeric,
  duration_minutes numeric,
  distance_km      numeric,
  notes            text,
  created_at       timestamptz not null default now(),

  constraint workouts_exercise_type_check
    check (exercise_type in ('resistance', 'cardio')),

  constraint workouts_exercise_name_not_blank
    check (btrim(exercise_name) <> ''),

  constraint workouts_resistance_rules check (
    exercise_type <> 'resistance' or (
      set_number is not null and set_number > 0
      and reps is not null and reps > 0
      and (weight_kg is null or weight_kg >= 0)
      and duration_minutes is null
      and distance_km is null
    )
  ),

  constraint workouts_cardio_rules check (
    exercise_type <> 'cardio' or (
      duration_minutes is not null and duration_minutes > 0
      and (distance_km is null or distance_km >= 0)
      and set_number is null
      and reps is null
      and weight_kg is null
    )
  )
);

create index workouts_workout_date_idx  on public.workouts (workout_date);
create index workouts_type_date_idx     on public.workouts (exercise_type, workout_date);
create index workouts_name_date_idx     on public.workouts (exercise_name, workout_date);

alter table public.workouts enable row level security;
```

---

## ٨. البيانات التجريبية

أُضيفت 3 صفوف تجريبية لتمرين **Dumbbell Biceps Curl** بتاريخ **2026-11-02**:

| `set_number` | `reps` | `weight_kg` |
|---|---|---|
| 1 | 8 | 14 |
| 2 | 10 | 12 |
| 3 | 10 | 10 |

> ✏️ **ملاحظة:** هذه هي القيم **عند الإضافة**. لاحقاً عُدِّل وزن المجموعة ٣ من **10** إلى **11** كغ. التفاصيل في القسم ١٤.
>
> ✏️ **ملاحظة ثانية:** لاحقاً أُضيف عمود `effort_level` ومُلئ للمجموعات الثلاث (8، 7، 6). التفاصيل في القسم ١٥.

أمر الإضافة:

```sql
insert into public.workouts
  (workout_date, exercise_type, exercise_name, set_number, reps, weight_kg)
values
  ('2026-11-02', 'resistance', 'Dumbbell Biceps Curl', 1,  8, 14),
  ('2026-11-02', 'resistance', 'Dumbbell Biceps Curl', 2, 10, 12),
  ('2026-11-02', 'resistance', 'Dumbbell Biceps Curl', 3, 10, 10)
returning *;
```

- الأعمدة `id` و `created_at` امتلأت تلقائياً.
- الأعمدة `duration_minutes` و `distance_km` و `notes` بقيت فارغة (NULL).

---

## ٩. استعلامات القراءة ونتائجها

النتائج التالية **تم التحقق منها فعلياً** من قاعدة البيانات.

### السؤال ١: ما أعلى وزن في Dumbbell Biceps Curl بتاريخ 2026-11-02؟

```sql
select max(weight_kg) as max_weight_kg
from public.workouts
where exercise_name = 'Dumbbell Biceps Curl'
  and workout_date = '2026-11-02';
```

| `max_weight_kg` |
|---|
| **14** |

### السؤال ٢: ما مجموع التكرارات في Dumbbell Biceps Curl بتاريخ 2026-11-02؟

```sql
select sum(reps) as total_reps
from public.workouts
where exercise_name = 'Dumbbell Biceps Curl'
  and workout_date = '2026-11-02';
```

| `total_reps` |
|---|
| **28** |

**التحقق اليدوي:**
- أعلى وزن من (14، 12، 10) هو **14** ✅
- مجموع التكرارات: 8 + 10 + 10 = **28** ✅

> ✏️ **بعد تعديل القسم ١٤:** النتيجتان **لم تتغيرا**.
> - أعلى وزن من (14، 12، 11) ما زال **14**.
> - التعديل غيّر الوزن فقط ولم يغيّر التكرارات، فالمجموع ما زال **28**.

---

## ١٠. شرح مختصر لأوامر SQL

| الأمر | معناه | ماذا يفعل؟ |
|---|---|---|
| `CREATE TABLE` | "أنشئ جدولاً" | ينشئ جدولاً جديداً ويحدد أعمدته وأنواعها وقواعده. |
| `INSERT` | "أضِف" | يضيف صفوفاً (بيانات) جديدة إلى الجدول. |
| `UPDATE` | "عدّل" | يغيّر بيانات صفوف **موجودة مسبقاً**. انظر القسم ١٤. |
| `SELECT` | "أعطني" | يقرأ البيانات ويعرضها **دون أن يغيّر فيها شيئاً**. |
| `WHERE` | "بشرط" | يختار فقط الصفوف التي تحقق شرطاً معيّناً. |
| `MAX` | "الأكبر" | يُرجع أكبر قيمة في عمود، مثل أثقل وزن. |
| `SUM` | "المجموع" | يجمع كل القيم في عمود، مثل مجموع التكرارات. |
| `AS` | "باسم" | يعطي عمود النتيجة اسماً واضحاً. |

---

## ١١. كيف تتحقق من الجدول في Supabase Table Editor

1. ادخل إلى [supabase.com/dashboard](https://supabase.com/dashboard) وسجّل الدخول.
2. اختر مشروع **gym-tracker**.
3. من القائمة الجانبية اضغط على **Table Editor**.
4. تأكد أن الـ schema المختار في الأعلى هو **public**.
5. اضغط على جدول **workouts**.
6. ستظهر لك الصفوف الثلاثة، وأسماء الأعمدة في الأعلى.
7. لرؤية أنواع الأعمدة: اضغط على السهم بجانب اسم أي عمود، ثم **Edit column**. أغلق النافذة دون حفظ.
8. ستلاحظ علامة **RLS enabled** بجانب اسم الجدول، وهذا يعني أن الحماية مفعّلة.

> 💡 **بديل:** من القائمة الجانبية اضغط **SQL Editor**، والصق أي استعلام `SELECT` من هذا الملف، ثم اضغط **Run**.
>
> ⚠️ **تجنّب** تعديل الصفوف أو حذفها من Table Editor إلا إذا كنت تقصد ذلك، لأن التغيير يُحفظ مباشرة.
>
> 📋 الخطوات نفسها تنطبق على جدول **personal_records**. اختره من القائمة بدل `workouts`.

---

## ١٢. الجدول الثاني: personal_records

اسم الجدول: **`public.personal_records`**

يحفظ **أفضل أداء شخصي** لك في تمارين المقاومة. كل صف يعني: "في هذا التاريخ، رفعتُ هذا الوزن، بهذا العدد من التكرارات، في هذا التمرين".

الجدول **فارغ حالياً**، ولم تُضَف إليه أي بيانات بعد.

### الأعمدة الـ 11

| # | العمود | النوع في PostgreSQL | إلزامي؟ | الغرض |
|---|---|---|---|---|
| 1 | `id` | `uuid` | نعم (تلقائي) | رقم تعريف فريد، يتولّد تلقائياً. وهو المفتاح الأساسي (primary key). |
| 2 | `exercise_name` | `text` | نعم | اسم التمرين، مثل `Dumbbell Biceps Curl`. |
| 3 | `best_weight_kg` | `numeric` | نعم | أفضل وزن بالكيلوغرام. |
| 4 | `reps` | `integer` | نعم | عدد التكرارات بهذا الوزن. |
| 5 | `achieved_date` | `date` | نعم | تاريخ تحقيق هذا الرقم. |
| 6 | `notes` | `text` | اختياري | ملاحظات حرّة. |
| 7 | `created_at` | `timestamptz` | نعم (تلقائي) | وقت إضافة الصف، يُسجَّل تلقائياً. |
| 8 | `exercise_id` | `uuid` | اختياري | رقم التمرين في جدول `exercises`. أُضيف لاحقاً، انظر القسم ١٦. |
| 9 | `user_id` | `uuid` | نعم | صاحب الرقم القياسي. أُضيف لاحقاً، انظر القسم ١٩. |
| 10 | `workout_id` | `uuid` | اختياري (فريد) | المجموعة في `workouts` التي حققت الرقم. أُضيف لاحقاً، انظر القسم ١٩. |
| 11 | `previous_best_kg` | `numeric` | اختياري | الرقم السابق قبل هذا الرقم، وفارغ إذا كان أول رقم. أُضيف لاحقاً، انظر القسم ١٩. |

### قواعد التحقق (Constraints)

| اسم القاعدة | ماذا تفعل؟ |
|---|---|
| `personal_records_exercise_name_not_blank` | اسم التمرين لا يمكن أن يكون فارغاً أو مسافات فقط. |
| `personal_records_best_weight_non_negative` | الوزن لا يكون سالباً، ويمكن أن يكون صفراً لتمارين وزن الجسم. |
| `personal_records_reps_positive` | عدد التكرارات يجب أن يكون أكبر من صفر. |

### الفهارس (Indexes)

| اسم الفهرس | الأعمدة | الفائدة |
|---|---|---|
| `personal_records_name_date_idx` | `exercise_name`, `achieved_date` | البحث السريع عن أرقامك القياسية لتمرين معيّن مع التاريخ. |

بالإضافة إلى فهرس المفتاح الأساسي `personal_records_pkey` الذي تنشئه قاعدة البيانات تلقائياً.

### الحماية (RLS)
**RLS مفعّلة** على هذا الجدول أيضاً. لا توجد قواعد وصول (policies) بعد، فلا يستطيع أي موقع أو تطبيق قراءة الجدول عبر الإنترنت.

### أمر إنشاء الجدول

```sql
create table public.personal_records (
  id              uuid        primary key default gen_random_uuid(),
  exercise_name   text        not null,
  best_weight_kg  numeric     not null,
  reps            integer     not null,
  achieved_date   date        not null,
  notes           text,
  created_at      timestamptz not null default now(),

  constraint personal_records_exercise_name_not_blank
    check (btrim(exercise_name) <> ''),

  constraint personal_records_best_weight_non_negative
    check (best_weight_kg >= 0),

  constraint personal_records_reps_positive
    check (reps > 0)
);

create index personal_records_name_date_idx
  on public.personal_records (exercise_name, achieved_date);

alter table public.personal_records enable row level security;
```

---

## ١٣. العلاقة بين الجدولين

> ✏️ **تحديث:** نُفِّذ لاحقاً الخيار ٢ (جدول `exercises`)، وأصبح الجدولان مرتبطين به رسمياً. التفاصيل في القسم ١٦. ما يلي يصف الوضع **قبل** ذلك التحديث.

### الوضع الحالي
- **لا توجد علاقة رسمية (foreign key)** بين الجدولين حتى الآن.
- الرابط الوحيد هو **اسم التمرين**: عمود `exercise_name` موجود في الجدولين.
- مثلاً، صف في `personal_records` اسمه `Dumbbell Biceps Curl` يخص الصفوف التي تحمل الاسم نفسه في `workouts`.

### مشكلة الربط بالاسم
إذا كُتب الاسم بطريقة مختلفة، مثل `Dumbbell Bicep Curl` بدون حرف s، فلن تعرف قاعدة البيانات أنه التمرين نفسه.

### خيارات للمستقبل (لم تُنفَّذ بعد)

1. **ربط الرقم القياسي بالمجموعة التي حققته:**
   - نضيف عموداً مثل `workout_id` في `personal_records`، يشير إلى صف معيّن في `workouts`.
   - هذا هو الـ **foreign key**، أي مفتاح يربط صفاً في جدول بصف في جدول آخر.
2. **جدول ثالث للتمارين (`exercises`):**
   - نضع فيه كل اسم تمرين مرة واحدة فقط.
   - الجدولان يشيران إليه بدل كتابة الاسم كنص، وهذا يمنع اختلاف كتابة الأسماء.
3. **حساب الرقم القياسي تلقائياً من `workouts`:**
   - بدل إدخاله يدوياً، نستخدم استعلاماً مثل `MAX(weight_kg)`، كما في القسم ٩.

---

## ١٤. سجل التعديلات: تعديل وزن المجموعة ٣

### ما الذي تغيّر؟

| | قبل | بعد |
|---|---|---|
| التمرين | Dumbbell Biceps Curl | Dumbbell Biceps Curl |
| التاريخ | 2026-11-02 | 2026-11-02 |
| `set_number` | 3 | 3 |
| `reps` | 10 | 10 |
| `weight_kg` | **10** | **11** |

**رقم تعريف الصف (`id`):** `06073f67-df68-41e5-980d-ffb846cedd8b`

### خطوات التعديل الآمن

**الخطوة ١: إيجاد الصف بـ `SELECT` قبل أي تعديل**

```sql
select id, exercise_name, workout_date, set_number, reps, weight_kg,
       count(*) over () as matching_rows
from public.workouts
where exercise_name = 'Dumbbell Biceps Curl'
  and workout_date = '2026-11-02'
  and set_number = 3
  and weight_kg = 10;
```

النتيجة: `matching_rows = 1`، أي **صف واحد فقط**، ورقم تعريفه هو المذكور أعلاه.

**الخطوة ٢: التعديل باستخدام رقم التعريف (`id`)**

```sql
update public.workouts
set weight_kg = 11
where id = '06073f67-df68-41e5-980d-ffb846cedd8b'
returning *;
```

**الخطوة ٣: التحقق بعد التعديل**

| `set_number` | `reps` | `weight_kg` | تغيّر؟ |
|---|---|---|---|
| 1 | 8 | 14 | لا |
| 2 | 10 | 12 | لا |
| 3 | 10 | **11** | **نعم** |

- عدد صفوف `workouts` ما زال **3**.
- جدول `personal_records` لم يتغير، وما زال **فارغاً**.
- في الصف المعدَّل نفسه، لم يتغير أي عمود غير `weight_kg`، بما في ذلك `created_at`.

### لماذا نعدّل بهذه الطريقة؟
- **`WHERE id = ...`:** رقم التعريف فريد ولا يتكرر، فنضمن تعديل صف واحد فقط.
- **`SELECT` أولاً:** نتأكد أننا نعدّل الصف الصحيح، وأن صفاً واحداً فقط يطابق الشروط.
- ⚠️ **تحذير:** أمر `UPDATE` **بدون** `WHERE` يعدّل **كل الصفوف** في الجدول.

---

## ١٥. سجل التعديلات: إضافة عمود effort_level

### ما هو العمود الجديد؟

| الخاصية | القيمة |
|---|---|
| اسم العمود | `effort_level` |
| النوع | `integer` (رقم صحيح بدون كسور) |
| القيم المسموحة | من **1** إلى **10**، أو فارغ (NULL) |
| إلزامي؟ | لا، اختياري |
| الغرض | مدى صعوبة التمرين كما شعرت به: 1 = سهل جداً، 10 = أقصى جهد |
| موقعه | العمود رقم 12، في آخر الجدول |

- العمود يصلح لتمارين **المقاومة والكارديو** معاً، فهو غير مرتبط بنوع التمرين.
- جدول `personal_records` **لم يتغير**.

### الخطوة ١: إضافة العمود وقاعدة التحقق (`ALTER TABLE`)

```sql
alter table public.workouts
  add column effort_level integer,
  add constraint workouts_effort_level_range
    check (effort_level is null or effort_level between 1 and 10);
```

- `ALTER TABLE` يغيّر **بنية الجدول**، وليس البيانات التي فيه.
- الصفوف الموجودة لم تتأثر، وكان العمود الجديد فيها **فارغاً** إلى أن ملأناه.
- قاعدة `workouts_effort_level_range` ترفض أي رقم خارج المدى، مثل 0 أو 11.

### الخطوة ٢: تعبئة القيم للمجموعات الثلاث (`UPDATE`)

```sql
update public.workouts set effort_level = 8
where id = '1c0707de-f2cd-460d-af9c-ee6fc76fae2d';  -- set 1

update public.workouts set effort_level = 7
where id = '885cd0dd-96c9-4014-b229-978d3f664a69';  -- set 2

update public.workouts set effort_level = 6
where id = '06073f67-df68-41e5-980d-ffb846cedd8b';  -- set 3
```

### الخطوة ٣: التحقق بعد التعديل

| `set_number` | `reps` | `weight_kg` | `effort_level` |
|---|---|---|---|
| 1 | 8 | 14 | **8** |
| 2 | 10 | 12 | **7** |
| 3 | 10 | 11 | **6** |

- عدد صفوف `workouts` ما زال **3**، وعدد أعمدته أصبح **12**.
- لم تتغير أي قيمة أخرى في الصفوف الثلاثة، بما في ذلك `created_at`.
- جدول `personal_records` ما زال فيه **7 أعمدة** و**صفر صفوف**.

### الفرق بين `ALTER TABLE` و `UPDATE`

| الأمر | ماذا يغيّر؟ | مثال |
|---|---|---|
| `ALTER TABLE` | **شكل** الجدول (الأعمدة والقواعد) | إضافة عمود `effort_level` |
| `UPDATE` | **قيم** الصفوف الموجودة | وضع الرقم 8 في المجموعة 1 |

---

## ١٦. مكتبة التمارين وحاوية الصور

### الفكرة
- جدول جديد اسمه `exercises`، فيه كل تمرين **مرة واحدة فقط**، مع اسمه ونوعه ومسار صورته.
- الجدولان `workouts` و `personal_records` يشيران إليه برقم التمرين (`exercise_id`).
- **عند تغيير صورة تمرين:** نعدّل **صفاً واحداً** في `exercises`، دون لمس أي صف في `workouts`.

```
                ┌──────────────────────┐
                │      exercises       │
                │──────────────────────│
                │ id (PK)              │
                │ name (فريد)          │──► image_path ──► Storage: exercise-images
                │ exercise_type        │
                │ image_path           │
                └──────────┬───────────┘
                           │ تمرين واحد ← له صفوف كثيرة
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌─────────────────┐       ┌──────────────────┐
     │    workouts     │       │ personal_records │
     │ exercise_id(FK) │       │ exercise_id (FK) │
     └─────────────────┘       └──────────────────┘
```

### جدول `public.exercises`: الأعمدة الـ 6

| # | العمود | النوع في PostgreSQL | إلزامي؟ | الغرض |
|---|---|---|---|---|
| 1 | `id` | `uuid` | نعم (تلقائي) | رقم تعريف فريد. وهو المفتاح الأساسي (primary key). |
| 2 | `name` | `text` | نعم | اسم التمرين، مثل `Dumbbell Biceps Curl`. |
| 3 | `exercise_type` | `text` | نعم | `resistance` أو `cardio` فقط. |
| 4 | `image_path` | `text` | اختياري | **مسار** الصورة داخل الحاوية، مثل `resistance/dumbbell-biceps-curl.webp`. ليس رابطاً كاملاً. |
| 5 | `created_at` | `timestamptz` | نعم (تلقائي) | وقت الإضافة. |
| 6 | `image_url` | `text` | تلقائي (محسوب) | الرابط الكامل للصورة، يُحسب تلقائياً من `image_path`. أُضيف لاحقاً، انظر القسم ١٨. |

**لماذا نحفظ المسار وليس الرابط الكامل؟** الرابط الكامل يحتوي على عنوان المشروع. إذا تغيّر العنوان يوماً، يبقى المسار صحيحاً، والتطبيق يركّب الرابط منه وقت العرض.

### قواعد التحقق في `exercises`

| اسم القاعدة | ماذا تفعل؟ |
|---|---|
| `exercises_name_trimmed` | الاسم لا يكون فارغاً، ولا يبدأ أو ينتهي بمسافة. |
| `exercises_exercise_type_check` | النوع `resistance` أو `cardio` فقط. |
| `exercises_image_path_format` | المسار ينتهي بـ `jpg` أو `jpeg` أو `png` أو `webp`، ولا يبدأ بالرمز `/`. أو يبقى فارغاً. |
| `exercises_id_type_unique` | قاعدة تقنية تسمح لـ `workouts` بالتحقق من تطابق النوع. |
| `exercises_name_unique_ci` (فهرس فريد) | **يمنع تكرار الأسماء** حتى لو اختلفت الحروف الكبيرة والصغيرة. مثلاً إذا وُجد `Treadmill` فلن يُقبل `treadmill`. |

### التمارين الموجودة حالياً

| `name` | `exercise_type` | `image_path` |
|---|---|---|
| Dumbbell Biceps Curl | resistance | NULL |
| Stationary Bike | cardio | NULL |
| Treadmill | cardio | NULL |
| Elliptical | cardio | NULL |
| Swimming | cardio | NULL |

كل التمارين **بدون صور حالياً**. ستُضاف الصور في خطوة لاحقة.

> ✏️ **تحديث:** رُفعت الصور لاحقاً، وأصبح لكل تمرين مسار صورته في `image_path`. التفاصيل في القسم ١٧.

### العلاقات (Foreign Keys)

| اسم القاعدة | من | إلى | المعنى |
|---|---|---|---|
| `workouts_exercise_fk` | `workouts (exercise_id, exercise_type)` | `exercises (id, exercise_type)` | كل تمرين مسجّل يشير إلى تمرين موجود **من النوع نفسه**، فلا يمكن ربط صف كارديو بتمرين مقاومة. |
| `personal_records_exercise_id_fkey` | `personal_records (exercise_id)` | `exercises (id)` | كل رقم قياسي يشير إلى تمرين موجود. |

- **`on delete restrict`:** يمنع حذف تمرين من `exercises` إذا كانت هناك صفوف مرتبطة به، وهذا يحمي سجلّك من الضياع.
- **عمود `exercise_name` في `workouts` بقي كما هو**، كنسخة احتياطية مقروءة.
- **`exercise_id` اختياري حالياً.** يمكن جعله إلزامياً لاحقاً، عندما يملؤه التطبيق دائماً.

### حاوية الصور `exercise-images`

| الإعداد | القيمة | المعنى |
|---|---|---|
| `public` | `true` | يمكن **عرض** الصورة لمن لديه رابطها. |
| `file_size_limit` | 2 ميغابايت | يرفض الملفات الأكبر. |
| `allowed_mime_types` | `image/jpeg`, `image/png`, `image/webp` | يرفض أي ملف ليس صورة. |

**طريقة تنظيم الملفات:**
```
exercise-images/
├── resistance/
│   └── dumbbell-biceps-curl.webp
└── cardio/
    ├── stationary-bike.webp
    ├── treadmill.webp
    ├── elliptical.webp
    └── swimming.webp
```

صور التمارين **ليست بيانات شخصية**، لذلك الحاوية عامة. إذا أردت رفع **صورك الشخصية** مستقبلاً، فالأفضل حاوية منفصلة **خاصة (private)**.

### قواعد الوصول (RLS و Storage)

| المكان | القراءة | الإضافة / التعديل / الحذف |
|---|---|---|
| جدول `exercises` | ✅ مسموحة للجميع، عبر قاعدة `Anyone can read exercises` | ❌ لا أحد عبر الإنترنت، فقط من لوحة Supabase |
| حاوية `exercise-images` | ✅ عرض الصورة لمن لديه رابطها. ❌ عرض قائمة كل الملفات ممنوع | ❌ لا أحد عبر الإنترنت، فقط من لوحة Supabase. لا توجد أي policy على `storage.objects` |
| `workouts` و `personal_records` | ❌ مقفلان بالكامل | ❌ مقفلان بالكامل |

### كيف تغيّر صورة تمرين لاحقاً؟

1. ارفع الصورة الجديدة **باسم جديد**، مثل `resistance/dumbbell-biceps-curl-v2.webp`.
2. عدّل **صفاً واحداً فقط** في `exercises`:

```sql
update public.exercises
set image_path = 'resistance/dumbbell-biceps-curl-v2.webp'
where name = 'Dumbbell Biceps Curl';
```

3. ستظهر الصورة الجديدة لكل التمارين المرتبطة، **دون لمس أي صف** في `workouts`.

**لماذا اسم جديد بدل استبدال الملف القديم؟** المتصفحات وخوادم Supabase تحتفظ بنسخة مؤقتة (cache) من الصور. لو استبدلنا الملف بالاسم نفسه، قد تبقى الصورة القديمة ظاهرة لفترة.

### أمر التنفيذ (Migration واحدة)

نُفِّذ كل ما يلي في **migration واحدة**. لو فشل أي جزء، كانت ستُلغى كلها ولا يتغير شيء.

```sql
-- 1. exercises table
create table public.exercises (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  exercise_type text        not null,
  image_path    text,
  created_at    timestamptz not null default now(),

  constraint exercises_name_trimmed
    check (name <> '' and name = btrim(name)),

  constraint exercises_exercise_type_check
    check (exercise_type in ('resistance', 'cardio')),

  constraint exercises_image_path_format
    check (image_path is null
           or (image_path !~ '^/' and image_path ~* '\.(jpg|jpeg|png|webp)$')),

  constraint exercises_id_type_unique unique (id, exercise_type)
);

create unique index exercises_name_unique_ci
  on public.exercises (lower(name));

alter table public.exercises enable row level security;

-- 2. Seed exercises (image_path stays NULL)
insert into public.exercises (name, exercise_type)
select distinct on (lower(btrim(exercise_name)))
       btrim(exercise_name), exercise_type
from public.workouts
order by lower(btrim(exercise_name)), created_at
on conflict do nothing;

insert into public.exercises (name, exercise_type)
values
  ('Stationary Bike', 'cardio'),
  ('Treadmill',       'cardio'),
  ('Elliptical',      'cardio'),
  ('Swimming',        'cardio')
on conflict do nothing;

-- 3. Link workouts to exercises (by name AND type)
alter table public.workouts
  add column exercise_id uuid;

alter table public.workouts
  add constraint workouts_exercise_fk
  foreign key (exercise_id, exercise_type)
  references public.exercises (id, exercise_type)
  on delete restrict;

create index workouts_exercise_id_idx
  on public.workouts (exercise_id);

update public.workouts w
set exercise_id = e.id
from public.exercises e
where lower(btrim(w.exercise_name)) = lower(e.name)
  and w.exercise_type = e.exercise_type
  and w.exercise_id is null;

-- 4. Link personal_records to exercises
alter table public.personal_records
  add column exercise_id uuid
  references public.exercises (id) on delete restrict;

create index personal_records_exercise_id_idx
  on public.personal_records (exercise_id);

-- 5. Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-images',
  'exercise-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- 6. RLS policy
create policy "Anyone can read exercises"
  on public.exercises
  for select
  to anon, authenticated
  using (true);
```

### التحقق بعد التنفيذ

| ما تحققنا منه | النتيجة |
|---|---|
| عدد التمارين في `exercises` | 5، وكلها `image_path = NULL` ✅ |
| RLS | مفعّلة على الجداول الثلاثة ✅ |
| قواعد الوصول | قاعدة واحدة فقط: `Anyone can read exercises` (قراءة). لا قواعد على `storage.objects` ✅ |
| Foreign keys | `workouts_exercise_fk` و `personal_records_exercise_id_fkey` ✅ |
| صفوف `workouts` غير المرتبطة | صفر، فالصفوف الثلاثة مرتبطة بـ `Dumbbell Biceps Curl` ✅ |
| بيانات `workouts` | الوزن والتكرارات والجهد والتاريخ و `created_at` لم تتغير ✅ |
| `personal_records` | فارغ ✅ |
| حاوية `exercise-images` | موجودة، عامة، الحد 2 ميغابايت، وعدد الملفات صفر ✅ |

**صفوف `workouts` بعد الربط:**

| `set_number` | `reps` | `weight_kg` | `effort_level` | مرتبط بـ |
|---|---|---|---|---|
| 1 | 8 | 14 | 8 | Dumbbell Biceps Curl |
| 2 | 10 | 12 | 7 | Dumbbell Biceps Curl |
| 3 | 10 | 11 | 6 | Dumbbell Biceps Curl |

---

## ١٧. سجل التعديلات: رفع صور التمارين

### مصدر الصور
- **صورتان مجمّعتان:** وصلت صورتان، في كل واحدة منهما التمارين الخمسة.
- **الاختيار:** اختيرت **المجموعة الحمراء**، وفيها اسم كل تمرين بالعربي والإنجليزي.
- **التقطيع:** قُطّعت الصورة إلى ٥ صور منفصلة بصيغة **JPEG**، صورة لكل تمرين.
- **نسخة محلية:** توجد نسخة من الصور على الجهاز في مجلد `exercise-images/` داخل المشروع.

### التمارين وصورها

| التمرين | النوع | `image_path` | الحجم |
|---|---|---|---|
| Dumbbell Biceps Curl | resistance | `resistance/dumbbell-biceps-curl.jpg` | 98 KB |
| Stationary Bike | cardio | `cardio/stationary-bike.jpg` | 85 KB |
| Treadmill | cardio | `cardio/treadmill.jpg` | 77 KB |
| Elliptical | cardio | `cardio/elliptical.jpg` | 121 KB |
| Swimming | cardio | `cardio/swimming.jpg` | 216 KB |

> **ملاحظة:** الصيغة الفعلية للملفات هي `.jpg`، وليست `.webp` كما في مثال تنظيم الملفات في القسم ١٦.

### الرابط العام لأي صورة

```
https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/<image_path>
```

مثال:

```
https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/cardio/treadmill.jpg
```

التطبيق يركّب هذا الرابط من `image_path` وقت العرض.

> ✏️ **تحديث:** أصبح هذا الرابط موجوداً جاهزاً في عمود `image_url` بجدول `exercises`. التفاصيل في القسم ١٨.

### خطوات الرفع

الحاوية مقفلة أمام الرفع عبر الإنترنت، لذلك فُتحت **مؤقتاً** لهذه الملفات الخمسة فقط، ثم أُغلقت فوراً:

**١. قاعدة رفع مؤقتة ومحدودة:**

```sql
create policy "Temp: upload 5 exercise images"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'exercise-images'
    and name in (
      'resistance/dumbbell-biceps-curl.jpg',
      'cardio/stationary-bike.jpg',
      'cardio/treadmill.jpg',
      'cardio/elliptical.jpg',
      'cardio/swimming.jpg'
    )
  );
```

**٢. رفع الملفات:** رُفعت الملفات الخمسة عبر Storage API باستخدام المفتاح العام للمشروع (anon / publishable key).
- هذا المفتاح **ليس سرياً**، فهو مصمَّم ليوضع داخل التطبيقات.
- **لا يوجد في هذا الملف**، ولا يجب وضع أي مفتاح هنا.

**٣. حذف القاعدة المؤقتة فوراً بعد الرفع:**

```sql
drop policy "Temp: upload 5 exercise images" on storage.objects;
```

**٤. تعبئة `image_path`:**

```sql
update public.exercises as e
set image_path = v.image_path
from (values
  ('Dumbbell Biceps Curl', 'resistance/dumbbell-biceps-curl.jpg'),
  ('Stationary Bike',      'cardio/stationary-bike.jpg'),
  ('Treadmill',            'cardio/treadmill.jpg'),
  ('Elliptical',           'cardio/elliptical.jpg'),
  ('Swimming',             'cardio/swimming.jpg')
) as v(name, image_path)
where e.name = v.name;
```

### التحقق بعد الرفع

| ما تحققنا منه | النتيجة |
|---|---|
| رفع الملفات الخمسة | نجحت كلها (رمز 200) ✅ |
| فتح كل صورة من رابطها العام | تعمل كلها، ونوعها `image/jpeg` ✅ |
| مطابقة الصور المرفوعة للنسخة المحلية | متطابقة 100% ✅ |
| كل `image_path` يشير إلى ملف موجود | نعم، للتمارين الخمسة ✅ |
| عدد الملفات في الحاوية | 5 ✅ |
| عدد التمارين في `exercises` | 5، فلم يُضَف تمرين جديد ✅ |
| القاعدة المؤقتة | حُذفت، ولا توجد أي قاعدة على `storage.objects` ✅ |
| قواعد الوصول في `public` | قاعدة واحدة فقط: `Anyone can read exercises` ✅ |
| صفوف `workouts` | لم تتغير، وما زالت مرتبطة بتمرينها ✅ |
| `personal_records` | فارغ ✅ |

### إضافة صور تمارين جديدة مستقبلاً
1. ارفع الصورة من لوحة Supabase إلى المجلد المناسب داخل الحاوية: Storage ← `exercise-images` ← `resistance` أو `cardio`.
2. استخدم اسماً واضحاً بحروف صغيرة وشرطات، مثل `cardio/rowing-machine.jpg`.
3. عدّل `image_path` للتمرين في جدول `exercises`.

---

## ١٨. سجل التعديلات: إضافة عمود image_url

### ما هو العمود الجديد؟

| الخاصية | القيمة |
|---|---|
| الجدول | `public.exercises` |
| اسم العمود | `image_url` |
| النوع | `text` |
| نوع العمود | **محسوب تلقائياً** (generated column) |
| القيمة | عنوان الحاوية + `image_path` |
| موقعه | العمود رقم 6 |

### أمر الإضافة

```sql
alter table public.exercises
  add column image_url text
  generated always as (
    'https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/'
    || image_path
  ) stored;
```

**الشرح:**
- **`generated always as (...)`:** القيمة تُحسب تلقائياً، و**لا يمكن الكتابة فيها يدوياً**.
- **`||`:** تعني "ألصق النصين ببعض".
- **`stored`:** الرابط محفوظ في الجدول، ويظهر مباشرة في Table Editor.
- **التحديث التلقائي:** إذا تغيّر `image_path`، يتغيّر `image_url` وحده.
- **بدون صورة:** إذا كان `image_path` فارغاً (NULL)، يكون `image_url` فارغاً أيضاً.

### الروابط الحالية

| التمرين | `image_url` |
|---|---|
| Dumbbell Biceps Curl | https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/resistance/dumbbell-biceps-curl.jpg |
| Stationary Bike | https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/cardio/stationary-bike.jpg |
| Treadmill | https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/cardio/treadmill.jpg |
| Elliptical | https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/cardio/elliptical.jpg |
| Swimming | https://jdhgmdxgjrfdezrteigl.supabase.co/storage/v1/object/public/exercise-images/cardio/swimming.jpg |

### التحقق بعد الإضافة

| ما تحققنا منه | النتيجة |
|---|---|
| العمود موجود ومحسوب تلقائياً (`ALWAYS`) | ✅ |
| الروابط الخمسة صحيحة | ✅ |
| فتح كل رابط من الجدول | يعمل (رمز 200)، ونوعه `image/jpeg` ✅ |
| `image_path` والصور في الحاوية | لم تتغير ✅ |
| `workouts` و `personal_records` | لم يتغيرا ✅ |

### تنبيه
الرابط يحتوي على عنوان المشروع مكتوباً داخل الأمر. إذا تغيّر عنوان المشروع أو اسم الحاوية يوماً:
- **`image_path` يبقى صحيحاً.**
- **`image_url` يحتاج تعديل الأمر:** يجب حذف العمود وإعادة إنشائه بالعنوان الجديد.

---

## ١٩. تطبيق الويب: الحسابات والجلسات والحماية

مع بناء تطبيق الويب (Next.js)، أصبحت قاعدة البيانات **متعددة المستخدمين**: كل شخص يسجّل دخوله بحسابه، ويرى بياناته فقط.

### تسجيل الدخول
- **الطريقة:** **إيميل + كلمة مرور** عبر Supabase Auth مباشرة، بالمفتاح العام فقط (publishable key).
- **كلمات المرور:** Supabase يحفظها مشفّرة، والتطبيق لا يراها ولا يخزنها.
- **إعدادات Supabase المطلوبة:** من Authentication ← Sign In / Providers:
  - **Allow new users to sign up:** مفعّل.
  - **Confirm email:** مُطفأ، لأن بريد Supabase المجاني لا يصل إلا لأعضاء فريق المشروع.
- **استعادة كلمة المرور:** تعمل عبر الإيميل لصاحب المشروع فقط. لتعمل للجميع يجب ربط خدمة بريد (Custom SMTP) مثل Resend.

### Migration A: جدول الجلسات والملكية والرقم القياسي التلقائي

**جدول جديد `public.workout_sessions`:** جلسة تمرين واحدة (مقاومة أو كارديو).

| العمود | النوع | الغرض |
|---|---|---|
| `id` | `uuid` | يُنشأ على الجهاز قبل الإرسال، فإعادة المحاولة لا تكرر الصف |
| `user_id` | `uuid` | صاحب الجلسة، والقيمة التلقائية `auth.uid()` |
| `session_type` | `text` | `resistance` أو `cardio` |
| `exercise_id` | `uuid` | التمرين. مربوط بـ `exercises (id, exercise_type)` فيجب أن يتطابق النوع |
| `status` | `text` | `active` أو `completed` أو `abandoned` |
| `workout_date` | `date` | **التاريخ المحلي** للمستخدم، وليس UTC |
| `started_at` / `ended_at` | `timestamptz` | وقت البداية والنهاية |
| `duration_seconds` | `integer` | المدة الفعلية بدون فترات الإيقاف |
| `target_duration_seconds` / `target_distance_km` | | أهداف الكارديو |
| `planned_sets` | `jsonb` | **نسخة من الخطة فقط**، ولا تُحسب كمجموعات مكتملة |
| `notes` | `text` | ملاحظات |

**أعمدة جديدة:**
- `workouts.user_id`
- `workouts.session_id`
- `personal_records.user_id`
- `personal_records.workout_id`
- `personal_records.previous_best_kg`

**منع التكرار:**

| الحماية | المعنى |
|---|---|
| المفتاح الأساسي `id` يُنشأ على الجهاز | إعادة إرسال نفس المجموعة بعد انقطاع الشبكة لا تُنشئ صفاً ثانياً (`ON CONFLICT (id) DO NOTHING`) |
| فهرس فريد `workouts_session_set_unique (session_id, set_number)` | لا يمكن حفظ نفس رقم المجموعة مرتين في نفس الجلسة |
| فهرس فريد `workouts_session_cardio_unique (session_id)` | جلسة كارديو واحدة = صف واحد فقط |

**الرقم القياسي التلقائي (Trigger `workouts_record_personal_best`):**
- **متى يعمل:** بعد إضافة أي مجموعة مقاومة.
- **ماذا يفعل:** تقارن قاعدة البيانات **نفسها** وزن المجموعة بأثقل وزن سابق لنفس المستخدم ونفس التمرين.
  - **إذا كان أثقل فعلاً:** يُضاف صف في `personal_records` مع الرقم السابق (`previous_best_kg`).
  - **التساوي:** لا يُعتبر رقماً جديداً.
- **الحماية:** المستخدم **لا يستطيع** إضافة رقم قياسي بنفسه، لأنه لا توجد صلاحية إضافة على هذا الجدول.

### قواعد الوصول الحالية (RLS)

| الجدول | قراءة | إضافة | تعديل | حذف |
|---|---|---|---|---|
| `exercises` | الجميع | ❌ | ❌ | ❌ |
| `workouts` | صاحب الصف فقط | صاحب الصف فقط | ❌ | ❌ |
| `workout_sessions` | صاحب الجلسة فقط | صاحب الجلسة فقط | صاحبها، **والجلسة نشطة فقط** | ❌ |
| `personal_records` | صاحب الرقم فقط | ❌ (الـ trigger فقط) | ❌ | ❌ |

- **السجل التاريخي محمي:** لا يوجد حذف لأي مستخدم، والجلسات المكتملة لا يمكن تعديلها.

### Migration B (أُلغيت)
- **ماذا أُنشئ:** أُنشئت مؤقتاً جداول لنظام "اسم مستخدم بدون إيميل": `profiles` و `user_roles` و `recovery_codes` و `auth_rate_limits`، والدالة `hit_rate_limit`.
- **لماذا أُلغيت:** هذا النظام كان يحتاج مفتاح السيرفر السري، فاستُبدل بالإيميل + كلمة المرور.
- **الحذف:** حُذفت الجداول والدالة وهي **فارغة**، ولم تُفقد أي بيانات.

### Migration C: ربط البيانات القديمة بصاحبها

```sql
update public.workouts
set user_id = '<owner-user-id>'
where user_id is null;

insert into public.personal_records
  (user_id, exercise_id, exercise_name, best_weight_kg, reps, achieved_date, workout_id, notes)
select user_id, exercise_id, exercise_name, weight_kg, reps, workout_date, id,
       'Backfilled from existing workouts'
from public.workouts
where id = '1c0707de-f2cd-460d-af9c-ee6fc76fae2d';

alter table public.workouts         alter column user_id set not null;
alter table public.personal_records alter column user_id set not null;
```

**ما الذي تغيّر؟**
- **الصفوف الثلاثة القديمة** (2026-11-02) أصبحت لحساب صاحب المشروع، وقيمها لم تتغير.
- **الرقم القياسي الأول** سُجّل من بيانات موثّقة: **14 كغ × 8**.
- **`user_id` أصبح إلزامياً:** في الجداول الثلاثة.
- **الصفوف القديمة بدون جلسة:** ليس لها `session_id`، والتطبيق يجمعها حسب التاريخ والتمرين. لم يُخترع لها وقت بداية أو نهاية.

### نتائج اختبارات القبول (2026-11-03)

كل السجلات التالية تحمل الملاحظة **"Acceptance test"**.

| الاختبار | النتيجة |
|---|---|
| **A: مقاومة** | Dumbbell Biceps Curl بثلاث مجموعات فعلية 8×14 و 9×12 و 10×15، ومؤقت راحة (+15 ث، إيقاف، استئناف، 30 ث، انتهاء مع تنبيه)، واستعادة بعد تحديث الصفحة. حُفظت **3 صفوف بالضبط**، والجلسة `completed` بمدة 138 ث. الـ trigger سجّل رقماً جديداً **15 كغ** (السابق 14) ✅ |
| **B: كارديو** | Treadmill بهدف 15 دقيقة، مع إيقاف واستئناف واستعادة بعد التحديث. ثم الإنهاء بمسافة 0.1 كم، وجهد 6، ومدة 26 ث. حُفظ **صف واحد وجلسة واحدة** ✅ |
| **C: أمان البيانات** | الزائر بدون حساب يرى 0 صفوف. مستخدم آخر (محاكاة) يرى 0. إعادة إرسال نفس المجموعة لم تُنشئ صفاً. نفس رقم المجموعة بمعرّف آخر رُفض (23505). الحذف والتعديل على جلسة مكتملة لم يغيّرا شيئاً. الكتابة باسم مستخدم آخر وإضافة رقم قياسي مزيّف رُفضتا (403) ✅ |
| **D: التصميم** | الجوال والكمبيوتر، عربي RTL وإنجليزي LTR، العدّادات والأزرار والفلاتر ✅ |

### تنبيه أمني متبقٍ
**Leaked Password Protection** (فحص كلمات المرور المسرّبة عبر HaveIBeenPwned) مُطفأ، وهو متاح في باقة Supabase المدفوعة فقط. التطبيق يرفض بدلاً من ذلك كلمات المرور القصيرة والشائعة.

---

## ٢٠. مكتبة العضلات والتمارين (2026-11-05)

### الفكرة
التدريب بالمقاومة أصبح على أربع خطوات: **المقاومة ← اختيار العضلة ← عرض دوّار ثلاثي الأبعاد للتمارين ← اختيار التمرين**، ثم صفحة تخطيط المجموعات المعتادة.

### الجداول الجديدة

| الجدول | الصفوف | الوصف |
|---|---|---|
| `muscle_groups` | 16 | مجموعة عضلية: `id` نصي (مثل `biceps`)، والاسم بالعربي والإنجليزي، والمنطقة (`front` / `back` / `legs`)، والترتيب، و`image_path` |
| `exercise_cards` | 77 | بطاقة لكل تمرين داخل مجموعة: `id` على شكل `group__slug`، و`group_id`، و`exercise_id`، والترتيب، و`image_path`، و`image_status` (`approved` / `needs_replacement`)، و`focus` اختياري |
| `exercise_card_muscles` | 149 | العضلات اللي تشتغل في كل بطاقة، مع الدور (`primary` / `secondary`) |

### أعمدة جديدة في `exercises`
`slug`، و`name_ar`، و`equipment`، و`aliases` (أسماء بديلة)، و`is_active`، و`catalog_status`.

- **عدد التمارين الحالي:** 80 تمريناً (76 مقاومة من المكتبة + 4 كارديو).
- **التمرين المرتبط بالسجل القديم:** **Dumbbell Curl** احتفظ بنفس المعرّف `1f37746b-aad2-476b-8f3b-61c16ca73b86`. أُضيف له الاسم البديل "Dumbbell Biceps Curl"، وسجل التمارين القديم والأرقام القياسية لم يتغيّر فيها شيء.
- **تمارين الكارديو:** الأربعة كما هي.

### الصلاحيات (أقل صلاحية ممكنة)
- **جداول المكتبة:** للقراءة فقط عند الزائر والمستخدم المسجّل. RLS مفعّلة، والإضافة والتعديل والحذف مسحوبة كلها.
- **`workouts`:** المستخدم يضيف صفوفه فقط، بلا تعديل ولا حذف.
- **`personal_records`:** لا يكتب فيه إلا الـ trigger.
- **`storage.objects`:** لا توجد عليه أي policy، فلا أحد من مستخدمي التطبيق يستطيع الرفع.

### رفع الصور (2026-11-05)
- **الملفات:** 91 صورة WebP، منها 16 للعضلات تحت `library/muscles/` و75 للبطاقات تحت `library/cards/`.
- **طريقة الرفع:** تمّت من جلسة صاحب المشروع نفسه، عبر policy **مؤقتة** تسمح بالإضافة فقط لحسابه ولهذه المسارات الـ 91 بالضبط.
- **بعد الرفع:** حُذفت الـ policy فوراً، وعدد الـ policies على `storage.objects` رجع **0**.
- **التحقق:** بصمة SHA-256 لكل ملف من الرابط العام طابقت الأصل: **91 / 91**.

### صور ما زالت تحتاج استبدال
| البطاقة | الحالة |
|---|---|
| `lower_back__romanian_deadlift` | `needs_replacement`، و`image_path = NULL` |
| `lower_back__conventional_deadlift` | `needs_replacement`، و`image_path = NULL` |

هاتان البطاقتان تظهران في التطبيق كمربع واضح مكتوب عليه **"الصورة بانتظار التصحيح"**، بدون أي رسم تشريحي. بطاقة **الرفعة الرومانية في مجموعة الخلفية** (`hamstrings__romanian_deadlift`) صورتها معتمدة.

### نتائج الاختبار
| الاختبار | النتيجة |
|---|---|
| عرض العضلات | 16 مجموعة، وكل الصور تُحمَّل (0 صور معطوبة) ✅ |
| العرض الدوّار | يعمل بالأسهم (مع مراعاة اتجاه RTL وLTR)، ويلفّ من الآخر للأول، والبطاقة الحالية تُحفظ في الرابط `?card=`، والبطاقتان المعلّقتان تظهران بشكل صحيح ✅ |
| تمرين كامل | Cable Curl بمجموعة واحدة 10 × 12 كغ، مع الملاحظة "Acceptance test": حُفظ صف واحد وجلسة `completed`، والـ trigger سجّل أول رقم قياسي **12 كغ** ✅ |
| فحص الصلاحيات | كل محاولات الكتابة كمستخدم مسجّل رُفضت: إضافة مجموعة عضلية، وتعديل البطاقات والتمارين، وحذف عضلات البطاقات، والرفع إلى Storage، وحذف التمارين، ورقم قياسي مزيّف. القراءة تعمل (77 بطاقة) ✅ |
| الكارديو | لم يتأثر ✅ |
