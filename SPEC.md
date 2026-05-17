# Bullet Journal PWA — 기능 요구사항 및 성공 조건

## 1. 개요

모바일 우선 PWA 형태의 Bullet Journal 앱.  
세 가지 로그(Future / Monthly / Daily)가 단방향으로 연동되며, Firebase Firestore를 데이터 저장소로 사용한다.  
오프라인에서도 동작하고, 추후 Google Play Store(TWA) 배포를 목표로 한다.

---

## 2. 데이터 모델

### BulletType
| 값 | 의미 | 아이콘 |
|----|------|--------|
| `task` | 할 일 | `•` |
| `event` | 이벤트 (Google Calendar 연동 예정) | `○` |
| `note` | 노트 | `–` |

### TaskStatus
| 값 | 의미 | 아이콘 |
|----|------|--------|
| `open` | 미완료 | `•` |
| `completed` | 완료 | `✕` (취소선) |
| `migrated` | 자동 이월됨 | `>` (amber) |
| `cancelled` | MIGRATED_CYCLE 전용 — 이월 중단 | `•` muted (취소선) |
| `scheduled` | 레거시 (현재 미사용) | — |

### EntryOrigin
| 값 | 출처 |
|----|------|
| `manual` | 직접 작성 |
| `from-monthly` | Monthly → Daily 자동 동기화 |
| `from-future` | (폐기됨, 기존 데이터 정리용) |
| `migrated` | 자동 이월 (useCarryForward) |

### 주요 필드
- `delayedMonthlyId` (DailyEntry) — 연기 시 생성된 Monthly 항목 ID. 존재 시 `<` amber 아이콘 표시.
- `sourceId` (MonthlyEntry) — Future Log에서 자동 생성된 경우 futureEntry.id.
- `scheduledDate` (Monthly/FutureEntry) — Daily Log 자동 동기화 대상 날짜.
- `gcalEventId` (BaseEntry) — Google Calendar 연동용 (미구현, 예약 필드).

---

## 3. 동기화 체인

```
Future Log ──► Monthly Log ──► Daily Log
   (useSyncFutureToMonthly)  (useSyncMonthlyToDaily)
```

- Future → Monthly: Future 항목 추가/수정/삭제 시 Monthly에 cascade 반영. `sourceId`로 연결.
- Monthly → Daily: `scheduledDate`가 있는 Monthly 항목이 해당 날짜의 Daily Log에 자동 추가.
- Daily → Future/Monthly: **단방향 — 역방향 동기화 없음**.
- Future에서 생성된 Daily 항목(`from-future`)은 정리 후 표시 제외.

---

## 4. 기능 요구사항

### 4-1. Daily Log

| # | 요구사항 |
|---|----------|
| D1 | 오늘 날짜가 기본 뷰. 날짜 네비로 전후 이동 가능. |
| D2 | task / event / note 세 가지 BulletType 입력 가능. |
| D3 | task 아이콘 탭 → `open` ↔ `completed` 토글. |
| D4 | 미완료 task는 매일 자동 이월(`>` amber). 완료할 때까지 Daily Log에 계속 출력. |
| D5 | 이월된 task(`origin: migrated`) 아이콘 탭 → `open` ↔ `cancelled` 토글. `cancelled` = 이월 중단(취소선). |
| D6 | task의 `<` 버튼 탭 → 날짜 선택 팝업 → 연기. Daily 항목은 `open` 유지, Monthly에 사본 생성. |
| D7 | 연기된 task는 `<` amber 아이콘으로 표시. 아이콘 탭 → 연기 취소(Monthly 사본 삭제). |
| D8 | Monthly/Future 자동 추가 항목(`from-monthly`)은 구분 표시(파란 테두리). |
| D9 | 삭제(`✕`), 연기(`<`) 버튼은 항상 40% 불투명도로 표시. 탭/호버 시 100%. |
| D10 | 한글 IME 중 Enter/버튼 탭 시 마지막 글자 중복 제출 방지. |

### 4-2. Monthly Log

| # | 요구사항 |
|---|----------|
| M1 | 년/월 네비로 이동. |
| M2 | task / event / note 입력. 날짜 지정 시 해당 Daily Log에 자동 추가. |
| M3 | 각 항목 왼쪽에 날짜(일 + 요일) 표시. 예: `17 Sun`. |
| M4 | `scheduledDate` 기준 오름차순 정렬. 없으면 `createdAt` 기준. |
| M5 | `scheduledDate` 있는 항목의 날짜 컬럼은 파란색. 탭 시 해당 Daily Log로 이동. |
| M6 | Future Log에서 자동 생성된 항목(`sourceId` 존재)은 파란 테두리 + `F` 뱃지. 내용/삭제 수정 불가. |
| M7 | 호버 시 inline date picker 표시 → scheduledDate 변경 가능. |

### 4-3. Future Log

| # | 요구사항 |
|---|----------|
| F1 | 년 단위 뷰. 월별 아코디언 접기/펼치기. |
| F2 | 항목 추가 시 월 + 날짜(선택) 지정. |
| F3 | Future 항목 삭제 시 연결된 Monthly 항목도 cascade 삭제. |
| F4 | Future 항목 추가/수정 시 Monthly에 자동 반영(동기화). |

### 4-4. 인증 및 데이터

| # | 요구사항 |
|---|----------|
| A1 | 앱 시작 시 Firebase 익명 로그인 자동 처리. |
| A2 | 설정 탭에서 Google 계정 연동 가능. |
| A3 | 로그아웃 후에도 localStorage `journalId` 유지 → 데이터 손실 없음. |
| A4 | Google 재로그인 시 기존 클라우드 데이터와 병합. |
| A5 | Firestore offline persistence 활성화 — 오프라인에서도 읽기/쓰기. |

---

## 5. 성공 조건 (Acceptance Criteria)

### Daily Log
- [ ] task 추가 후 `•` 표시. 탭 시 `✕`(취소선) → 다시 탭 시 `•` 복원.
- [ ] event 추가 후 파란 `○` + 파란 테두리 표시.
- [ ] note 추가 후 `–` 표시. 기호가 cancelled/note 간 혼동 없음.
- [ ] 미완료 task는 다음날 `>` amber로 자동 이월됨. 이월 항목은 별도 섹션 표시.
- [ ] `<` 버튼 탭 → 날짜 선택 팝업 → 확인 시 Monthly에 task 생성, Daily는 `<` amber 유지.
- [ ] `<` amber 아이콘 탭 → 연기 취소 → Monthly 항목 삭제, `<` 사라짐.
- [ ] Monthly 자동 추가 항목은 파란 테두리 + `M` 뱃지, 내용 편집 불가.

### Monthly Log
- [ ] 날짜 지정 항목이 해당 날짜 Daily Log에 자동 추가됨.
- [ ] 항목이 `scheduledDate` 기준 오름차순 정렬.
- [ ] 파란 날짜 컬럼 탭 → 해당 날짜 Daily Log로 이동.
- [ ] Future 자동 생성 항목(`F` 뱃지) 삭제 시 Future 원본도 삭제됨.

### Future Log
- [ ] 항목 삭제 시 Monthly 연동 항목도 함께 삭제됨.
- [ ] 항목 수정(내용/날짜) 시 Monthly에 즉시 반영됨.
- [ ] `scheduledDate` 있는 Future 항목이 Monthly Log에 자동 추가됨.

### 인증
- [ ] 익명 상태에서 데이터 저장 및 오프라인 조회 가능.
- [ ] Google 연동 후 로그아웃 → 재로그인 시 데이터 유지.
- [ ] 다른 기기에서 Google 로그인 시 동일 데이터 접근.

---

## 6. 자동 이월 (useCarryForward)

- 앱 마운트 시마다 실행 (throttle 없음).
- 오늘 이전 날짜의 `taskStatus: 'open'` task를 오늘 날짜로 복사.
- 원본 task → `taskStatus: 'migrated'`.
- 중복 방지: 이미 이월된 항목(`sourceId`로 연결된 migrated 항목)은 재이월 제외.
- 적용 대상: `origin`과 무관 (manual / from-monthly / from-future / migrated 모두 포함).

---

## 7. 연기 흐름 (Defer Flow)

```
Daily task(open)
  └─ [< 버튼] → 날짜 선택
       ├─ Monthly task 생성 (scheduledDate = 선택 날짜)
       ├─ Daily task에 delayedMonthlyId 저장
       └─ Daily task 유지 (open, < amber 표시)
            ├─ [완료] → Daily task completed, Monthly task 별도 관리
            └─ [< 탭 — undo] → Monthly task 삭제, delayedMonthlyId 제거
```

---

## 8. 기술 스택

| 분류 | 선택 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 번들러 | Vite 5 |
| 스타일 | Tailwind CSS v3 (다크 테마) |
| 애니메이션 | Framer Motion |
| 상태관리 | Zustand |
| DB | Firebase Firestore (offline persistence) |
| 인증 | Firebase Auth (익명 + Google OAuth) |
| PWA | vite-plugin-pwa (Workbox) |
| 날짜 | date-fns |
| ID | nanoid |

---

## 9. Firestore 컬렉션 구조

```
journals/{journalId}/
  dailyLogs/{entryId}    — date, origin, sourceId?, delayedMonthlyId?
  monthlyLogs/{entryId}  — year, month, scheduledDate?, sourceId?
  futureLogs/{entryId}   — year, month, scheduledDate?

userJournals/{uid}       — { journalId }   (uid ↔ journalId 매핑)
```

---

## 10. 미구현 / 향후 계획

- Google Calendar API 연동 (`gcalEventId` 필드 예약됨)
- Android TWA 패키징 (홈화면 위젯)
- Cloudflare Pages 배포
- 로컬 서버 DB 마이그레이션 (온프레미스 옵션)
