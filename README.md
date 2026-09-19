# SmartExpense

**ردیاب هوشمند هزینه شخصی — کاملاً تحت وب، بدون نصب**  
**Smart personal expense tracker — 100% web-based, zero install**

---

## English

### What is this?

SmartExpense is a fast, modular, browser-only expense tracker designed for real daily use.

- No server, no account, no `pip install`
- Data stays on your device (localStorage)
- Excel / PDF / dashboard image export
- Monthly budget + progress bar
- Smart suggestions based on your spending
- “What-if” simulation (cut a category by X%)
- Charts: category share + monthly trend
- Clean RTL Persian UI, works on mobile and desktop

### Quick Start

1. Open the repository on GitHub and click **Open in GitHub Pages** (if enabled), **or**
2. Download / clone and open `index.html` in any modern browser, **or**
3. Serve locally:

```bash
git clone https://github.com/Beig-Rules/SmartExpense.git
cd SmartExpense
# any static server, e.g.:
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

### Features

| Feature | Description |
|---------|-------------|
| Add expenses | Date, category, amount, optional note |
| Dashboard KPIs | This month total, transaction count, daily average, budget |
| Budget | Set monthly ceiling + visual progress |
| Suggestions | Automatic tips from your real data |
| Simulation | Estimate savings if you cut one category by 5–50% |
| Filters | By month and category |
| Export | Excel (.xlsx), PDF, PNG screenshot of charts |
| Privacy | Everything local — nothing uploaded |

### Project structure (modular)

```
SmartExpense/
├── index.html          # Shell & layout
├── css/styles.css      # UI
├── js/
│   ├── storage.js      # Persistence (localStorage)
│   ├── suggestions.js  # Tips + simulation logic
│   ├── charts.js       # Chart.js wrappers
│   ├── export.js       # Excel / PDF / Image
│   └── app.js          # UI controller
├── README.md
└── LICENSE
```

CDN libraries (loaded in the browser only when you open the app):

- Chart.js — charts
- SheetJS (xlsx) — Excel export
- jsPDF — PDF export
- html2canvas — image export

No build step. No Node. No Python packages.

### Performance notes

- Minimal DOM updates on each action
- Charts destroyed/recreated only when data changes
- Synchronous localStorage for instant response
- Lightweight CSS, no heavy frameworks

---

## فارسی

### این پروژه چیست؟

**SmartExpense** یک ردیاب هزینه شخصی سریع، ماژولار و کاملاً تحت‌وب است که برای استفاده واقعی روزمره طراحی شده.

- بدون سرور، بدون حساب کاربری، بدون نصب پکیج
- داده‌ها فقط روی دستگاه خودت (localStorage)
- خروجی اکسل، PDF و عکس از داشبورد
- بودجه ماهانه + نوار پیشرفت
- پیشنهاد هوشمند بر اساس هزینه‌های واقعی
- شبیه‌سازی «اگر این دسته را X٪ کم کنم چقدر ذخیره می‌شود؟»
- نمودار سهم دسته‌ها و روند ماهانه
- رابط فارسی راست‌چین، مناسب موبایل و دسکتاپ

### شروع سریع

1. فایل `index.html` را در مرورگر باز کن، یا
2. مخزن را کلون کن و با یک سرور استاتیک ساده سرو کن:

```bash
git clone https://github.com/Beig-Rules/SmartExpense.git
cd SmartExpense
python3 -m http.server 8080
```

سپس آدرس `http://localhost:8080` را باز کن.

### قابلیت‌ها

- ثبت هزینه (تاریخ، دسته، مبلغ، توضیح)
- خلاصه ماه، تعداد تراکنش، میانگین روزانه
- بودجه ماهانه و هشدار مصرف
- پیشنهادهای هوشمند
- شبیه‌سازی کاهش هزینه
- فیلتر ماه و دسته
- خروجی Excel / PDF / تصویر
- حریم خصوصی کامل (بدون ارسال داده به جایی)

### ساختار ماژولار

هر بخش جداست تا بعداً راحت گسترش داده شود:

- `storage.js` → ذخیره‌سازی
- `suggestions.js` → منطق پیشنهاد و شبیه‌سازی
- `charts.js` → نمودارها
- `export.js` → خروجی‌ها
- `app.js` → کنترل رابط کاربری

---

## License / مجوز

MIT License  
Copyright © 2026 Beig (Beig-Rules)

---

**ساخته‌شده برای استفاده واقعی، سریع و بدون دردسر**  
**Built for real daily use — fast, private, zero friction**
