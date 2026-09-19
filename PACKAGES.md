# GitHub Packages — SmartExpense

## فعال‌شده برای این ریپو

| Registry | Status | Identifier |
|----------|--------|------------|
| **npm** (GitHub Packages) | Workflow publish | `@beig-rules/smart-expense` |
| **Containers** (GHCR) | Workflow publish | `ghcr.io/beig-rules/smartexpense` |
| Apache Maven | Not applicable | JS static app — no Java artifacts |
| NuGet | Not applicable | No .NET project |
| RubyGems | Not applicable | No Ruby project |

> صفحه Packages تا اولین publish موفق خالی می‌ماند. بعد از سبز شدن workflow، پکیج‌ها ظاهر می‌شوند.

## npm — نصب

```bash
# یک‌بار: توکن GitHub با scope read:packages
echo "//npm.pkg.github.com/:_authToken=YOUR_GH_TOKEN" >> ~/.npmrc
echo "@beig-rules:registry=https://npm.pkg.github.com" >> ~/.npmrc

npm install @beig-rules/smart-expense
```

محتوای استاتیک اپ داخل پکیج است (`index.html`, `css/`, `js/`, …).

## Container — اجرا

```bash
docker pull ghcr.io/beig-rules/smartexpense:latest
docker run --rm -p 8080:80 ghcr.io/beig-rules/smartexpense:latest
# باز کردن http://localhost:8080
```

اگر ایمیج private بود:

```bash
echo YOUR_GH_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

## اجرای دستی publish

GitHub → Actions → **Publish GitHub Packages** → Run workflow

یا هر push به `main` که فایل‌های مرتبط را تغییر دهد.

## چرا Maven / NuGet / RubyGems نیست؟

این رجیستری‌ها برای اکوسیستم Java / .NET / Ruby هستند. SmartExpense اپ وب استاتیک JS است؛ ساخت artifact جعلی آن زبان‌ها فقط صفحه Packages را شلوغ می‌کند و برای کاربر فایده ندارد.

## Visibility

- پکیج‌های GitHub به‌صورت پیش‌فرض ممکن است private باشند تا وقتی در UI پکیج Visibility را Public کنید (Settings پکیج).
- برای استفاده عمومی بدون توکن، بعد از اولین publish: Package settings → Change visibility → Public.
