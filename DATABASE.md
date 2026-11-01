# توثيق قاعدة بيانات Gym Tracker

## ١. نظرة عامة على المشروع

**Gym Tracker** مشروع لتسجيل التمارين الرياضية ومتابعة التقدّم مع الوقت.

قاعدة البيانات تحفظ كل تمرين تقوم به، سواء كان:
- **تمرين مقاومة (resistance):** مثل رفع الأوزان، ويُسجَّل فيه رقم المجموعة وعدد التكرارات والوزن.
- **تمرين كارديو (cardio):** مثل الدراجة الثابتة أو جهاز المشي، ويُسجَّل فيه المدة والمسافة.

الهدف أن تستطيع لاحقاً معرفة أشياء مثل: أثقل وزن رفعته، ومجموع تكراراتك في يوم معيّن، وتطوّرك مع الوقت.

قاعدة البيانات فيها حالياً **جدولان**:
- `workouts`: سجل كل التمارين.
- `personal_records`: أفضل أداء شخصي في تمارين المقاومة. تفاصيله في القسم ١٢.

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

## ٤. الأعمدة الـ 11

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

### الفهارس (Indexes)
الفهرس يشبه فهرس الكتاب، يجعل البحث أسرع بكثير:

| اسم الفهرس | الأعمدة | الفائدة |
|---|---|---|
| `workouts_workout_date_idx` | `workout_date` | البحث حسب التاريخ. |
| `workouts_type_date_idx` | `exercise_type`, `workout_date` | البحث حسب النوع (مقاومة/كارديو) مع التاريخ. |
| `workouts_name_date_idx` | `exercise_name`, `workout_date` | البحث حسب اسم التمرين مع التاريخ. |

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

### الأعمدة الـ 7

| # | العمود | النوع في PostgreSQL | إلزامي؟ | الغرض |
|---|---|---|---|---|
| 1 | `id` | `uuid` | نعم (تلقائي) | رقم تعريف فريد، يتولّد تلقائياً. وهو المفتاح الأساسي (primary key). |
| 2 | `exercise_name` | `text` | نعم | اسم التمرين، مثل `Dumbbell Biceps Curl`. |
| 3 | `best_weight_kg` | `numeric` | نعم | أفضل وزن بالكيلوغرام. |
| 4 | `reps` | `integer` | نعم | عدد التكرارات بهذا الوزن. |
| 5 | `achieved_date` | `date` | نعم | تاريخ تحقيق هذا الرقم. |
| 6 | `notes` | `text` | اختياري | ملاحظات حرّة. |
| 7 | `created_at` | `timestamptz` | نعم (تلقائي) | وقت إضافة الصف، يُسجَّل تلقائياً. |

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
