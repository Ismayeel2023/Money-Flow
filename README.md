# Money Flow

A mobile-first personal finance app for tracking where your money goes. It runs in the browser and ships to Android as a native app with Capacitor.

## Features

- **Accounts & transactions:** multiple accounts, transfers, balance adjustments, transaction details
- **Budgets & savings goals:** monthly budgets per category and goals you can track over time
- **Bills & subscriptions:** a bills calendar with due-date reminders and recurring subscriptions
- **Split bills:** split expenses with friends and track who owes what
- **Statement import:** import bank statements from CSV and PDF, with dedicated parsers for **SBI** and **Kotak** statements and a review step before saving
- **Automatic tracking on Android:** reads bank SMS and notifications to detect new transactions
- **Rules engine:** auto-categorise transactions by merchant and keyword rules
- **Reports:** category spending analysis, merchant breakdowns and activity history
- **Security & backup:** app lock with biometrics/device unlock, plus automatic backup and export

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Motion
- **Mobile:** Capacitor (Android) with custom Java plugins for notifications, reminders, device unlock and backups
- **Storage:** IndexedDB on the web, native storage on Android
- **PDF parsing:** pdf.js
- **Testing:** Vitest (15 test suites covering parsers, balances, rules, backups and more)
- **CI:** GitHub Actions builds a debug APK on every push

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # run the test suite
```

## Build for Android

```bash
npm run build
npx cap sync android
npx cap open android   # build and run from Android Studio
```

A debug APK is also built automatically by the **Build Android Debug APK** workflow in GitHub Actions.
