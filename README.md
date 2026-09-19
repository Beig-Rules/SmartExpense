# SmartExpense

**ردیاب هوشمند هزینه شخصی — کاملاً تحت وب، بدون نصب**  
**Smart personal expense tracker — 100% web-based, zero install**

**Repo:** https://github.com/Beig-Rules/SmartExpense

---

## English

### Highlights

- Add / **edit** / delete expenses
- Custom categories
- Monthly budget + progress
- Smart suggestions + cut-category simulation
- Optimized charts (skip redundant redraws)
- Export: **Excel, PDF, PNG, JSON backup**
- Import JSON (replace or merge)
- Optional **PIN lock** (SHA-256 via Web Crypto)
- XSS-escaped rendering; no server; data stays in localStorage
- Modular JS; static hosting / GitHub Pages ready

### Run locally

```bash
git clone https://github.com/Beig-Rules/SmartExpense.git
cd SmartExpense
python3 -m http.server 8080
```

Open `http://localhost:8080`.

### GitHub Pages

1. Repo **Settings → Pages**
2. Source: **GitHub Actions** (workflow `.github/workflows/pages.yml` is included)
3. After the first successful workflow run, the site URL will appear under Pages settings  
   (typically `https://beig-rules.github.io/SmartExpense/`)

### Structure

```
js/storage.js      persistence, backup, PIN
js/suggestions.js  tips + simulation
js/charts.js       optimized Chart.js
js/export.js       Excel / PDF / image / JSON
js/app.js          UI controller
css/styles.css
index.html
SECURITY.md
```

### Security

See [SECURITY.md](SECURITY.md). PIN is a casual-access lock, not bank-grade encryption.

---

## فارسی

### قابلیت‌ها

- ثبت، **ویرایش** و حذف هزینه
- دسته‌بندی سفارشی
- بودجه ماهانه
- پیشنهاد هوشمند و شبیه‌سازی کاهش هزینه
- نمودار بهینه‌شده
- خروجی اکسل، PDF، عکس، پشتیبان JSON
- ورود پشتیبان (جایگزینی یا ادغام)
- قفل اختیاری با PIN
- داده فقط روی دستگاه شما

### اجرا

```bash
git clone https://github.com/Beig-Rules/SmartExpense.git
cd SmartExpense
python3 -m http.server 8080
```

### GitHub Pages

از Settings → Pages منبع را روی GitHub Actions بگذار تا workflow منتشر شود.

---

## License

MIT © 2026 Beig (Beig-Rules)
