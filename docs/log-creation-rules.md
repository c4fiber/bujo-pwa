# BuJo PWA — 로그 생성 규칙

## 탭 구조

```
Future Log   Daily Log   Routine   Review   Settings
```

Monthly Log는 제거되었습니다. 월 단위 계획은 **Future Log**에서, 날짜가 정해진 일은 **Daily Log**에서 관리합니다.

---

## Future Log
- **날짜**: 연(year) + 월(month) 단위. 특정 일(day) 없음.
- **용도**: 아직 날짜가 정해지지 않은 그 달에 할 일 / 계획.
- **📅 (Future → Daily)**: 날짜가 정해지면 캘린더로 날짜를 선택해 해당 날짜의 Daily Log로 편성(`origin: from-future`). Future 항목은 `scheduled` 처리.

## Daily Log
- **날짜**: 현재 보는 날짜. 상단 ‹ › 또는 📅(캘린더)로 원하는 날짜로 자유롭게 이동. "오늘" 버튼으로 즉시 복귀.
- **용도**: 그 날 실제로 처리하는 항목.
- **📅 (다른 날짜로 이동)**: 항목을 캘린더로 선택한 다른 날짜로 이동(`origin: migrated`). 원본은 `migrated` 처리(취소선 토글 가능).
- **밀린 항목**: 오늘 화면 상단에 오늘 이전의 미완료 task를 노출. [오늘로 / 완료 / 취소]로 의식적으로 정리(자동 이월 없음).

## Routine
- 꾸준히 반복하고 싶은 루틴의 **월 단위 달성률**을 추적.
- GitHub 잔디 형태 그리드(요일 정렬). 셀을 탭하면 상태 순환:
  - 회색(미기록) → 🟩 성공 → 🟥 실패 → 회색
  - 오늘 이후(도달하지 않은) 날짜는 회색 + 비활성.
- 헤더에 달성률(%)과 성공/도달일 수 표시.

## Review
- 한 해의 Daily 기록을 월별로 되돌아보는 읽기 전용 화면.

---

## 데이터 컬렉션
- `dailyLogs`, `futureLogs`, `routines`, `routineLogs`
- (레거시 `monthlyLogs`는 더 이상 사용하지 않음)
