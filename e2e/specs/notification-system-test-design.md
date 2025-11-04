# E2E Test Design: 알림 시스템 (Notification System)

## 코드베이스 분석 결과

### 알림 시스템 구조
- **알림 표시**: `useNotifications` 훅에서 관리
- **메시지 형식**: `"${notificationTime}분 후 ${title} 일정이 시작됩니다."`
- **검사 주기**: 1초마다 실행

### 알림 표시 조건
```
0 < (일정_시작_시각 - 현재_시각) ≤ notificationTime분

예: 14:00 시작, notificationTime 10분
→ 13:50~14:00 사이에 알림 표시
```

---

## 테스트 시나리오

### TC-NTF-01: 알림 시간 도래 시 메시지 표시
- **목표**: 알림 시간이 되었을 때 올바른 메시지가 표시되는지 확인
- **사전 조건**:
  - 시간 고정: 2025-10-15 13:50:00
  - 테스트 데이터 초기화

- **실행 단계**:
  - [ ] 일정 생성 (notificationTime: 10, 시작: 14:00)
    - 제목: "팀 회의"
    - 날짜: 2025-10-15
    - 시작시간: 14:00
    - 종료시간: 14:30
  - [ ] API 요청 완료 대기
  - [ ] 1초 진행

- **예상 결과**:
  - Alert가 표시됨
  - 메시지: "10분 후 팀 회의 일정이 시작됩니다."

---

### TC-NTF-02: 알림 범위 밖에서는 표시 안 됨
- **목표**: 알림 범위를 벗어나면 알림이 표시되지 않는지 확인
- **사전 조건**:
  - 시간 고정: 2025-10-15 13:00:00
  - 일정 생성 (notificationTime: 10, 시작: 14:00)

- **실행 단계**:
  - [ ] 1초 진행

- **예상 결과**:
  - Alert가 표시되지 않음 (11분 이상 남아 있음)

---

### TC-NTF-03: 여러 일정의 알림이 독립적으로 표시됨
- **목표**: 각 일정의 알림이 정확한 시간에 표시되는지 확인
- **사전 조건**:
  - 시간 고정: 2025-10-15 13:45:00
  - 테스트 데이터 초기화

- **실행 단계**:
  - [ ] 첫 번째 일정 생성 (notificationTime: 10, 시작: 13:55)
    - 제목: "회의 1"
  - [ ] 두 번째 일정 생성 (notificationTime: 5, 시작: 14:00)
    - 제목: "회의 2"
  - [ ] 1초 진행
  - [ ] 첫 번째 알림만 표시되는지 확인
  - [ ] 시간을 13:55로 설정
  - [ ] 1초 진행
  - [ ] 두 번째 알림이 추가로 표시되는지 확인

- **예상 결과**:
  - 13:45: 첫 번째 알림만 표시 (Alert 1개)
  - 13:55: 두 번째 알림 추가 표시 (Alert 2개)

---

## 구현 가이드

### Locators
- **Alert 메시지**: `page.getByText('10분 후 팀 회의 일정이 시작됩니다.')`
- **Alert 개수 확인**: `page.getByRole('alert').count()`

### 시간 조작
```typescript
// 시간 고정
await page.clock.install({ time: new Date('2025-10-15T13:50:00Z') });

// 1초 진행
await page.clock.runFor(1000);

// 특정 시각으로 변경
await page.clock.setSystemTime(new Date('2025-10-15T13:55:00Z'));
```

### 기존 헬퍼 함수 사용
- `initializeTestData(page)` - 데이터 초기화
- `createTestEvent(page, eventData)` - 일정 생성
- `waitForEventLoading(page)` - 로딩 완료 대기

### 테스트 데이터
```typescript
const notificationEvent: EventForm = {
  title: '팀 회의',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '14:30',
  description: '',
  location: '',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};
```
