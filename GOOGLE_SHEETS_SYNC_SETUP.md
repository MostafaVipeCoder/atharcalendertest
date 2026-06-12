# Google Sheets Sync Setup (No ngrok!)

تم التعديل ليستخدم جوجل اسكربت بس بدون ngrok أو webhook! السيرفر بيقوم بقراءة الجدول كل 30 ثانية تلقائيًا!

## 0. Enable Realtime in Supabase (for frontend refresh)
لازم نعمل enable realtime عشان ال frontend يتحدد تلقائيًا لما البيانات تتغير:
1. اذهب لـ Supabase Dashboard → Database → Replication
2. تحت "Supabase Database"، اضغط على الـ 3 نقط → Toggle Realtime
3. تأكد أن الـ `public` schema مفعّل
4. اذهب لـ Database → Tables
5. لكل من الجدولين `projects` و `project_schedules`:
   - اضغط على 3 نقط → Edit table
   - تحت "Realtime"، اختر "Enable Realtime"
   - احفظ التغييرات!

## 1. Publish Your Google Sheet as CSV
لازم ننشر الجدول عشان نقدر نقرأ منه من السيرفر:
1. افتح جدولك على Google Sheets
2. اضغط على File → Share → Publish to web
3. تحت "Link"، اختر الـ sheet اللي عاوزين نقرأ منه (Sheet1)
4. اختر "Comma-separated values (.csv)" بدل "Web page"
5. اضغط على Publish → OK
6. احفظ الرابط اللي طلعلك بس مش محتاج تضيفه في الكود لأننا مبدلينه بالفعل!

## 2. Add the Google Apps Script (Optional but Useful!)
ده بيضيف قائمة مخصصة في Google Sheet عشان تسهل عليك:
1. افتح جدولك على Google Sheets
2. اضغط على Extensions → Apps Script
3. امسح أي كود موجود في المحرر
4. لصق الكود من ملف `google-apps-script.js`
5. اضغط على Save وسمي المشروع (مثل "Calendar Sync Menu")
6. راجع إلى Google Sheet واغلقها وافتحها تاني
7. الآن هتجى قائمة جديدة اسمها "📅 Calendar Sync" في الشريط العلوي!

## 3. Update Your .env File
تأكد أنك عندك هذي المتغيرات في `.env`:
```env
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```
الـ Service Role Key تيجي من Supabase Dashboard → Project Settings → API → Project API keys

## 4. That's It!
الآن:
- السيرفر بيعمل sync تلقائي كل ٣٠ ثانية
- الـ calendar يتحدد تلقائيًا لما البيانات تتغير بفضل الـ Supabase Realtime
- تقدر تضغط على زر "تزامن مع الشيت" يدويًا كمان لو عاوز!
- في Google Sheet هتجى قائمة جديدة "📅 Calendar Sync" عشان تعرف تفاصيل الـ sync!

## Notes:
- في production يمكن تعديل الـ SYNC_INTERVAL في server.ts عشان يزيد الوقت (مثل كل 5 دقائق)
- تأكد أن الجدول your Google Sheet مفتوح للـ "Anyone with the link can view" أو أنك publishedه بصورة صحيحة!
