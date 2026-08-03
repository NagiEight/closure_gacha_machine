# Arknights Gacha Simulator (UI)

A modern, cross-platform Flutter application built to simulate Arknights headhunting banners, and track sanity regeneration timers.

---

## 🚀 Features
simulate Arknights headhunting banners, and track sanity regeneration timers

---

## 🏗️ Architecture & Project Structure

The codebase follows **Clean Architecture / Ports & Adapters (Hexagonal Architecture)** design principles:

```text
lib/
├── application/           # Application use cases
│   └── use_cases/         # Business logic flows (GetBanners, GetGachaRoll)
├── domain/                # Enterprise business rules
│   ├── entities/          # Core domain models (API & Local entities)
│   ├── ports/             # Abstract interfaces (GachaPort)
│   └── repositories/      # Repository domain abstractions
├── infrastructure/        # Frameworks & Drivers / Adapters
│   ├── adapters/          # External REST API client (ClosureGachaMachineAdapter)
│   └── repositories/      # Hive & SharedPreferences concrete repositories
└── presentation/          # User Interface layer
    ├── pages/             # App screens (Banners, Dashboard, History, Sanity Timer, Settings)
    ├── painter/           # Custom Canvas painters
    └── widgets/           # Modular UI components grouped by feature
```

---

## 🛠️ Tech Stack & Dependencies

* **Framework**: [Flutter](https://flutter.dev/) (Dart SDK ^3.12.2)
* **Error Tracking**: [`sentry_flutter`](https://pub.dev/packages/sentry_flutter) - Production crash reporting and performance tracing.
* **Environment Configuration**: [`flutter_dotenv`](https://pub.dev/packages/flutter_dotenv) - Environment variable management.
* **Local Storage & Caching**:
  * [`hive_flutter`](https://pub.dev/packages/hive_flutter) - Fast key-value database for caching banners and operator metadata.
  * [`shared_preferences`](https://pub.dev/packages/shared_preferences) - Local key-value store for user preferences and local metrics.
* **Networking**: [`http`](https://pub.dev/packages/http) - REST API communication with Closure Gacha backend.
* **Data Visualization**: [`fl_chart`](https://pub.dev/packages/fl_chart) - Interactive charts for dashboard analytics.
* **Media & UI**:
  * [`cached_network_image`](https://pub.dev/packages/cached_network_image) - Smooth remote image loading and caching.
  * [`flutter_local_notifications`](https://pub.dev/packages/flutter_local_notifications) - System notifications for sanity timers.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and set your configuration variables:

```bash
cp .env.example .env
```

Available `.env` variables:
* `BASE_URL`: API Base Endpoint (Default: `http://localhost:3000`)
* `CLOUD_URL`: Asset CDN Base Endpoint (Default: `https://nagicloud.uk`)
* `SENTRY_DSN`: Sentry DSN key for crash reporting
* `ENVIRONMENT`: Deployment environment tag (`development`, `production`)

---

## 🔄 CI/CD Pipelines

GitHub Actions workflows are configured under `.github/workflows/`:

* **Continuous Integration (`ci.yml`)**:
  * Runs on `push` and `pull_request` to `main`/`master`/`develop`.
  * Executes static analysis (`flutter analyze`), unit & widget tests (`flutter test`), code coverage generation, and builds web bundle release verification.
* **Continuous Deployment (`release.yml`)**:
  * Runs when a release tag is created (`v*.*.*`).
  * Compiles release Web and Android APK artifacts and publishes a GitHub Release automatically.

---

## 🏁 Getting Started

### Prerequisites

Ensure you have the Flutter SDK installed on your machine. Check your installation with:

```bash
flutter doctor
```

### Installation & Run

1. Clone the repository and navigate to the project directory:
   ```bash
   cd ui
   ```

2. Fetch Flutter dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app on your preferred target device (Desktop, Web, or Mobile):
   ```bash
   flutter run
   ```

---

## 🧪 Testing & Linting

Run code analysis:
```bash
flutter analyze
```

Run unit & widget tests:
```bash
flutter test
```
