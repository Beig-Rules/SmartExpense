# SmartExpense

**ردیاب هوشمند هزینه شخصی — کاملاً تحت وب**  
**Smart personal expense tracker — 100% web-based**

**Repository:** https://github.com/Beig-Rules/SmartExpense

---

## English — Complete guide

### 1. What you get

- Local-only expense ledger (browser `localStorage`)
- Monthly budget + progress bar
- Smart tips + “cut category by X%” simulation
- **Three.js** 3D candy charts + **Chart.js** 2D charts
- Light / dark theme, optional PIN lock
- Export: **structured Excel workbook**, PDF, PNG, JSON backup
- Custom categories, edit / delete rows
- PWA shell (optional offline cache of app files)

No account. No server. No `npm install` required to use.

### 2. Quick start (step by step)

1. Clone or download the repo:
   ```bash
   git clone https://github.com/Beig-Rules/SmartExpense.git
   cd SmartExpense
   ```
2. Serve over HTTP (needed for some CDN features and service worker):
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in Chrome / Firefox / Safari / Edge.
4. Register a few expenses (date, amount, category).
5. Set a monthly budget if you want alerts.
6. Open **خروجی / Export** → Excel to download a multi-sheet ledger.

**GitHub Pages:** Settings → Pages → Source = GitHub Actions (workflow included). After the first green run, use the Pages URL.

### 3. Using the app

| Action | How |
|--------|-----|
| Add expense | Form on the right/top → Submit |
| Edit / delete | Row actions in the table |
| Filter | Month + category dropdowns |
| Budget | Enter ceiling → Save budget |
| Simulation | Pick category + percent → Calculate |
| Theme | 🌙 / ☀️ button |
| PIN | Security card → set PIN → Lock |
| Backup in | Import JSON (replace or merge) |
| Backup out | Export → JSON |

### 4. Excel structure (database-like)

The `.xlsx` file contains **five sheets**:

| Sheet | Role |
|-------|------|
| **Meta** | Report id, export time, totals, budget |
| **Expenses** | Full ledger: `id`, `date`, `year_month`, `category`, `amount`, `note`, timestamps |
| **By_Category** | Aggregates + `share_pct` + transaction count |
| **By_Month** | Monthly totals + counts |
| **Dictionary** | Column definitions (data dictionary) |

Amounts are **plain numbers** (easy to pivot in Excel). Currency is toman-oriented in the UI.

### 5. Technical notes

- Stack: static HTML/CSS/JS, Chart.js, Three.js, SheetJS, jsPDF, html2canvas (CDN).
- Data keys: `se_expenses_v2`, `se_budget_v2`, `se_categories_v2`, `se_meta_v2`.
- PIN: SHA-256 hash only (Web Crypto); not included in JSON backup.
- WebGL required for 3D charts; 2D charts still work without it.

### 6. Precautions

- Clearing site data deletes expenses — export JSON regularly.
- PIN is a **casual** lock, not bank-grade encryption.
- Shared computers: enable PIN and lock when leaving.
- Do not treat this as official accounting software for tax audit without your own verification.
- Large 3D scenes on very old phones may use more battery; 2D charts remain available.

### 7. Practical money tips (suggestions, not advice)

- Set a monthly budget slightly below last month’s real spend.
- Watch categories above ~40% of the month — use the simulation tool.
- Export Excel at month-end and archive the file with the month name.
- Merge imports carefully; prefer **replace** only when restoring a known-good backup.

### 8. License

MIT © 2026 Beig (Beig-Rules)

---

## فارسی — راهنمای کامل گام‌به‌گام

### ۱. این برنامه چیست؟

SmartExpense یک ردیاب هزینه **روی مرورگر** است:

- ثبت، ویرایش، حذف هزینه
- بودجه ماهانه و هشدار
- پیشنهاد هوشمند و شبیه‌سازی کاهش هزینه
- نمودار **سه‌بعدی Three.js** و نمودار کلاسیک Chart.js
- تم روشن/تاریک، قفل PIN اختیاری
- خروجی اکسل ساخت‌یافته، PDF، تصویر، پشتیبان JSON

بدون نصب پکیج، بدون سرور، بدون حساب کاربری.

### ۲. راه‌اندازی

```bash
git clone https://github.com/Beig-Rules/SmartExpense.git
cd SmartExpense
python3 -m http.server 8080
```

آدرس `http://localhost:8080` را باز کن.

برای انتشار عمومی: در GitHub، Settings → Pages → منبع **GitHub Actions**.

### ۳. کار با برنامه

1. از فرم «ثبت هزینه» تاریخ، مبلغ و دسته را وارد کن.
2. بودجه ماه را در همان کارت ذخیره کن تا نوار پیشرفت دیده شود.
3. از بخش پیشنهاد و شبیه‌سازی برای سناریوی «اگر این دسته را کم کنم» استفاده کن.
4. فیلتر ماه/دسته را برای مرور لیست به کار ببر.
5. از منوی **خروجی** فایل اکسل چندبرگی بگیر.
6. روی دستگاه مشترک PIN بگذار و دکمه قفل را بزن.

### ۴. ساختار فایل اکسل

| برگه | محتوا |
|------|--------|
| Meta | شناسه گزارش، زمان خروجی، جمع کل، بودجه |
| Expenses | دفتر کامل ردیف‌ها (مثل جدول دیتابیس) |
| By_Category | جمع هر دسته + درصد سهم |
| By_Month | جمع هر ماه |
| Dictionary | معنی هر ستون |

مبالغ به‌صورت **عدد خام** ذخیره می‌شوند تا در اکسل جمع و Pivot راحت باشد.

### ۵. نکات احتیاط

- پاک کردن داده‌های سایت = پاک شدن هزینه‌ها → مرتب JSON بگیر.
- PIN قفل ساده است، جایگزین رمزنگاری دیسک نیست.
- این ابزار کمک شخصی است، نه نرم‌افزار حسابرسی رسمی.
- برای بازیابی فقط از فایلی که خودت ساختی استفاده کن.

### ۶. پیشنهادهای مالی کاربردی

- بودجه را کمی کمتر از میانگین واقعی ماه‌های قبل بگذار.
- اگر یک دسته بیش از حدود ۴۰٪ ماه را بلعید، شبیه‌سازی کاهش را اجرا کن.
- آخر هر ماه اکسل را با نام همان ماه بایگانی کن.
- هزینه‌های کوچک پرتکرار را یک‌جا ثبت کن تا میانگین روزانه معنی‌دار بماند.

### ۷. فونت‌ها و ظاهر

- فارسی: **Vazirmatn**
- انگلیسی UI: **Outfit**
- اعداد: **JetBrains Mono** / tabular figures برای تراز ستونی مبلغ‌ها

### ۸. مجوز

MIT © ۲۰۲۶ Beig (Beig-Rules)

---

**Built for real daily use — private, structured, bilingual.**
