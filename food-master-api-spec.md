# Food Master — Spec فني لأداة البحث العامة

هذا السبيك مبني على القرارات اللي اتفقنا عليها: ماينفعش الموقع (GitHub Pages) يكلم قاعدة البيانات مباشرة، وكل حاجة لازم تمر بالـ backend على Railway.

## 1) الـ Endpoint الوحيد المطلوب

```
GET /api/foods/search?q=<كلمة البحث>&page=1
```

- **مفيش** endpoint بيرجع كل الداتا (`/foods/all` ممنوع نهائيًا).
- الرد بيرجّع بس الحقول اللي محتاجها الواجهة: `name`, `serving_note`, `kcal`, `protein`, `carbs`, `fat`.
- الرد مش بيرجّع: `evidence_grade`, `source`, `internal_notes`, أو أي عمود إداري تاني.
- Pagination إجباري: أقصى حاجة 15 نتيجة في الصفحة.

## 2) كود Express جاهز (Node.js — يتحط على نفس السيرفر الموجود على Railway)

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limit: 25 طلب في الدقيقة لكل IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كتير في وقت قصير، حاول تاني بعد شوية.' }
});

router.get('/api/foods/search', searchLimiter, async (req, res) => {
  const q = (req.query.q || '').trim();
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const PAGE_SIZE = 15;

  if (q.length < 2) {
    return res.status(400).json({ error: 'اكتب كلمة بحث أوضح' });
  }

  // استبدل الاستعلام ده بالاستعلام الفعلي على PostgreSQL بتاعك
  const results = await db.query(
    `SELECT name, serving_note, kcal, protein, carbs, fat
     FROM foods
     WHERE name ILIKE $1
     ORDER BY name
     LIMIT $2 OFFSET $3`,
    [`%${q}%`, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  );

  res.json({ query: q, page, results: results.rows });
});

module.exports = router;
```

## 3) إعدادات CORS (في نفس ملف السيرفر الرئيسي)

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://thenewtrition.com', 'https://www.thenewtrition.com'],
  methods: ['GET']
}));
```

## 4) الخطوات اللي محتاجة منك فعليًا

1. تركيب المكتبتين على السيرفر: `npm install express-rate-limit cors`
2. لصق كود الـ router في مكانه المناسب في مشروع الـ backend الحالي على Railway، وتوصيل `db.query` بنفس اتصال PostgreSQL الموجود.
3. تجربة الـ endpoint بعد الرفع: `curl https://<your-railway-domain>/api/foods/search?q=فول`
4. تحديث رابط الـ `fetch()` في `food-master.html` (مرفق) بالدومين الحقيقي بتاع الـ backend بعد النشر.

هذا الجزء الوحيد من الخطة اللي محتاج نشر فعلي على Railway — الملفات التانية (index/pro/learn/software) جاهزة للاستخدام مباشرة على GitHub Pages.
