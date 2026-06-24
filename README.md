# Bujo PWA

Bullet Journal PWA — Firebase + React + TypeScript

test on https://bujo-pwa.web.app/daily

## 기능

- **Daily Log**: 오늘의 할 일, 메모, 이벤트를 빠르게 기록
- **Monthly Log**: 한 달의 일정과 태스크 한눈에 보기
- **Future Log**: 미래 날짜에 예약 등록
- **Review**: 미완료 항목 이월(Carry Forward) 처리
- **오프라인 지원**: IndexedDB 기반 로컬 캐시로 네트워크 없이도 사용 가능
- **Google 계정 연동**: 익명 데이터를 Google 계정으로 마이그레이션, 다기기 동기화

## 시작하기

### 환경 설정

```bash
cp .env.example .env
# .env에 Firebase 프로젝트 설정값 입력
```

### 개발 서버

```bash
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

## 배포

`firebase` 브랜치에 push하면 GitHub Actions가 자동으로 Firebase Hosting에 배포합니다.

필요한 GitHub Secrets:

| Secret | 설명 |
|--------|------|
| `VITE_FIREBASE_API_KEY` | Firebase 웹 앱 API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `VITE_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage 버킷 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase 앱 ID |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase 서비스 계정 JSON (콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성) |

## 기술 스택

- **Frontend**: React 19, Vite, TypeScript, TailwindCSS, Framer Motion
- **로컬 DB**: Dexie (IndexedDB)
- **클라우드**: Firebase (Firestore, Auth, Hosting)
- **상태 관리**: Zustand
- **PWA**: vite-plugin-pwa + Workbox
