# E2E Test Design: 일정 겹침 처리 (단순화 버전)

## 1. 개요

### 테스트 목적
사용자가 **일정 생성, 수정, 드래그 앤 드롭** 시 겹치는 일정을 감지하고 경고 다이얼로그를 통해 사용자 선택을 처리하는 기능을 검증합니다.

### 설계 원칙
- **성공 케이스 위주** (Happy Path 70-80%)
- **단순한 시나리오만** (기본 CRUD 레벨)
- **시각적 요소 제외** (시각적 회귀 테스트에서 별도 진행)
- **총 8개 테스트 케이스** (4개 시나리오)

### 테스트 범위
| 시나리오 | TC 수 | 내용 |
|---------|-------|------|
| 시나리오 1: 일정 생성 시 겹침 | 3개 | 겹침 감지, 경계값(2개) |
| 시나리오 2: 다이얼로그 처리 | 2개 | 취소, 계속 진행 |
| 시나리오 3: 드래그 앤 드롭 | 2개 | 겹침 감지, 취소 |
| 시나리오 4: 일정 수정 시 겹침 | 1개 | 수정 폼에서 겹침 감지 |
| **합계** | **8개** | |

---

## 2. 시나리오별 테스트 케이스

### 시나리오 1: 일정 생성 시 겹침 감지

**목표**: 일정 생성 폼에서 겹침을 감지하고 다이얼로그를 표시하는지 확인

#### TC1.1: 겹침 감지 - 다이얼로그 표시

**목적**: 기존 일정과 겹치는 새 일정 생성 시 겹침 다이얼로그 표시

**사전 조건 (Arrange)**:
```typescript
// 브라우저 시간 고정
await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });

// 기존 일정 생성
await createTestEvent(page, {
  title: '기존 회의',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '16:00'
});
```

**테스트 동작 (Act)**:
```typescript
// 겹치는 새 일정 입력 (14:30-15:30)
await page.locator('#title').fill('새 미팅');
await page.locator('#date').fill('2025-10-15');
await page.locator('#start-time').fill('14:30');
await page.locator('#end-time').fill('15:30');
await page.getByTestId('event-submit-button').click();
```

**예상 결과 (Assert)**:
```typescript
// 겹침 다이얼로그 표시 확인
await expect(page.getByText('일정 겹침 경고')).toBeVisible();
await expect(page.getByText('다음 일정과 겹칩니다:')).toBeVisible();
await expect(page.getByText(/기존 회의.*2025-10-15.*14:00-16:00/)).toBeVisible();

// 버튼 표시 확인
await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
await expect(page.getByRole('button', { name: '계속 진행' })).toBeVisible();
```

---

#### TC1.2: 경계값 - 겹치지 않음 (14:00-16:00 vs 16:00-18:00)

**목적**: 시간 경계값에서 겹치지 않는 케이스 검증

**사전 조건 (Arrange)**:
```typescript
await createTestEvent(page, {
  title: '오후 회의',
  date: '2025-10-16',
  startTime: '14:00',
  endTime: '16:00'
});
```

**테스트 동작 (Act)**:
```typescript
// 경계값: 정확히 16:00 시작
await page.locator('#title').fill('저녁 회의');
await page.locator('#date').fill('2025-10-16');
await page.locator('#start-time').fill('16:00');
await page.locator('#end-time').fill('18:00');
await page.getByTestId('event-submit-button').click();
```

**예상 결과 (Assert)**:
```typescript
// 겹침 다이얼로그가 표시되지 않음
await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

// 일정이 정상 생성됨
await expect(page.getByTestId('event-list').getByText('저녁 회의')).toBeVisible();
```

---

#### TC1.3: 경계값 - 겹치지 않음 (14:00-16:00 vs 12:00-14:00)

**목적**: 시간 경계값에서 겹치지 않는 케이스 검증 (반대 방향)

**사전 조건 (Arrange)**:
```typescript
await createTestEvent(page, {
  title: '점심 회의',
  date: '2025-10-17',
  startTime: '14:00',
  endTime: '16:00'
});
```

**테스트 동작 (Act)**:
```typescript
// 경계값: 정확히 14:00 종료
await page.locator('#title').fill('오전 회의');
await page.locator('#date').fill('2025-10-17');
await page.locator('#start-time').fill('12:00');
await page.locator('#end-time').fill('14:00');
await page.getByTestId('event-submit-button').click();
```

**예상 결과 (Assert)**:
```typescript
// 겹침 다이얼로그가 표시되지 않음
await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

// 일정이 정상 생성됨
await expect(page.getByTestId('event-list').getByText('오전 회의')).toBeVisible();
```

---

### 시나리오 2: 겹침 다이얼로그 처리

**목표**: 겹침 다이얼로그에서 사용자 선택이 정상 작동하는지 확인

#### TC2.1: 다이얼로그 취소 - 일정 미생성

**목적**: "취소" 버튼 클릭 시 일정이 생성되지 않는지 확인

**사전 조건 (Arrange)**:
```typescript
await createTestEvent(page, {
  title: '기존 일정',
  date: '2025-10-18',
  startTime: '10:00',
  endTime: '12:00'
});
```

**테스트 동작 (Act)**:
```typescript
// 겹치는 새 일정 입력
await page.locator('#title').fill('취소할 일정');
await page.locator('#date').fill('2025-10-18');
await page.locator('#start-time').fill('11:00');
await page.locator('#end-time').fill('13:00');
await page.getByTestId('event-submit-button').click();

// 겹침 다이얼로그에서 취소 클릭
await expect(page.getByText('일정 겹침 경고')).toBeVisible();
await page.getByRole('button', { name: '취소' }).click();
```

**예상 결과 (Assert)**:
```typescript
// 다이얼로그 닫힘
await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

// 새 일정이 생성되지 않음
const eventList = page.getByTestId('event-list');
await expect(eventList.getByText('취소할 일정')).not.toBeVisible();

// 기존 일정은 유지
await expect(eventList.getByText('기존 일정')).toBeVisible();

// 폼이 유지됨 (사용자가 다시 수정 가능)
await expect(page.locator('#title')).toHaveValue('취소할 일정');
```

---

#### TC2.2: 다이얼로그 계속 진행 - 일정 생성

**목적**: "계속 진행" 버튼 클릭 시 일정이 생성되는지 확인

**사전 조건 (Arrange)**:
```typescript
await createTestEvent(page, {
  title: '기존 일정',
  date: '2025-10-19',
  startTime: '10:00',
  endTime: '12:00'
});
```

**테스트 동작 (Act)**:
```typescript
// 겹치는 새 일정 입력
await page.locator('#title').fill('생성할 일정');
await page.locator('#date').fill('2025-10-19');
await page.locator('#start-time').fill('11:00');
await page.locator('#end-time').fill('13:00');
await page.getByTestId('event-submit-button').click();

// 겹침 다이얼로그에서 계속 진행 클릭
await expect(page.getByText('일정 겹침 경고')).toBeVisible();
await page.getByRole('button', { name: '계속 진행' }).click();

// 네트워크 요청 완료 대기
await page.waitForLoadState('networkidle');
```

**예상 결과 (Assert)**:
```typescript
// 다이얼로그 닫힘
await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

// 새 일정이 생성됨
const eventList = page.getByTestId('event-list');
await expect(eventList.getByText('생성할 일정')).toBeVisible();
await expect(eventList.getByText('11:00 - 13:00')).toBeVisible();

// 기존 일정도 유지
await expect(eventList.getByText('기존 일정')).toBeVisible();

// 폼이 초기화됨
await expect(page.locator('#title')).toHaveValue('');
```

---

### 시나리오 3: 드래그 앤 드롭 시 겹침 감지

**목표**: 드래그로 일정을 이동할 때 겹침 감지 및 처리 확인

#### TC3.1: 드래그로 겹치는 날짜로 이동 시 다이얼로그 표시

**목적**: 드래그 앤 드롭으로 겹치는 날짜로 이동 시 다이얼로그 표시

**사전 조건 (Arrange)**:
```typescript
// 월간 뷰로 변경
const event1 = await createTestEvent(page, {
  title: '이동할 일정',
  date: '2025-10-20',
  startTime: '10:00',
  endTime: '11:00'
});

const event2 = await createTestEvent(page, {
  title: '대상 일정',
  date: '2025-10-21',
  startTime: '10:00',
  endTime: '11:00'
});

// 월간 뷰로 전환
await switchToMonthView(page);
```

**테스트 동작 (Act)**:
```typescript
// 드래그 앤 드롭: 10-20 → 10-21로 이동
const draggable = page.getByText('이동할 일정').first();
const target = page.locator('[data-date="2025-10-21"]');
await draggable.dragTo(target);
```

**예상 결과 (Assert)**:
```typescript
// 겹침 다이얼로그 표시
await expect(page.getByText('일정 겹침 경고')).toBeVisible();
await expect(page.getByText(/대상 일정.*2025-10-21.*10:00-11:00/)).toBeVisible();
```

---

#### TC3.2: 드래그 겹침 취소 - 원래 위치 유지

**목적**: 드래그 겹침에서 취소 선택 시 원래 위치에 유지되는지 확인

**사전 조건 (Arrange)**:
TC3.1과 동일

**테스트 동작 (Act)**:
```typescript
// 드래그 앤 드롭
const draggable = page.getByText('이동할 일정').first();
const target = page.locator('[data-date="2025-10-21"]');
await draggable.dragTo(target);

// 다이얼로그에서 취소 클릭
await expect(page.getByText('일정 겹침 경고')).toBeVisible();
await page.getByRole('button', { name: '취소' }).click();
```

**예상 결과 (Assert)**:
```typescript
// 다이얼로그 닫힘
await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

// 일정이 원래 위치(10-20)에 그대로 있음
const originalCell = page.locator('[data-date="2025-10-20"]');
await expect(originalCell.getByText('이동할 일정')).toBeVisible();

// 대상 위치(10-21)에는 원래 일정만 있음
const targetCell = page.locator('[data-date="2025-10-21"]');
await expect(targetCell.getByText('이동할 일정')).not.toBeVisible();
await expect(targetCell.getByText('대상 일정')).toBeVisible();
```

---

### 시나리오 4: 일정 수정 시 겹침 감지

**목표**: 일정 수정 폼에서 겹침을 감지하고 다이얼로그를 표시하는지 확인

#### TC4.1: 수정 폼에서 겹침 감지

**목적**: 기존 일정을 수정하여 다른 일정과 겹칠 때 다이얼로그 표시

**사전 조건 (Arrange)**:
```typescript
const event1 = await createTestEvent(page, {
  title: '수정할 일정',
  date: '2025-10-22',
  startTime: '09:00',
  endTime: '10:00'
});

const event2 = await createTestEvent(page, {
  title: '충돌 대상',
  date: '2025-10-22',
  startTime: '11:00',
  endTime: '12:00'
});
```

**테스트 동작 (Act)**:
```typescript
// 수정 버튼 클릭
const editButton = page.locator('button[aria-label="Edit event"]').first();
await editButton.click();

// 시간 변경 (09:00-10:00 → 10:30-11:30, 충돌 대상과 겹침)
await page.locator('#start-time').clear();
await page.locator('#start-time').fill('10:30');
await page.locator('#end-time').clear();
await page.locator('#end-time').fill('11:30');

// 제출
await page.getByTestId('event-submit-button').click();
```

**예상 결과 (Assert)**:
```typescript
// 겹침 다이얼로그 표시
await expect(page.getByText('일정 겹침 경고')).toBeVisible();
await expect(page.getByText(/충돌 대상.*2025-10-22.*11:00-12:00/)).toBeVisible();

// 취소 시 원래 시간 유지
await page.getByRole('button', { name: '취소' }).click();
const eventList = page.getByTestId('event-list');
await expect(eventList.getByText('09:00 - 10:00')).toBeVisible();
```

---

## 3. 테스트 데이터

### 기본 일정 데이터 구조
```typescript
interface TestEventData {
  title: string;        // 일정 제목
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:MM
  endTime: string;      // HH:MM
}
```

### 각 시나리오별 데이터
| TC | 기존 일정 | 새 일정 | 기대 결과 |
|----|----------|--------|---------|
| TC1.1 | 14:00-16:00 | 14:30-15:30 | 겹침 O |
| TC1.2 | 14:00-16:00 | 16:00-18:00 | 겹침 X |
| TC1.3 | 14:00-16:00 | 12:00-14:00 | 겹침 X |
| TC2.1 | 10:00-12:00 | 11:00-13:00 | 취소 → 미생성 |
| TC2.2 | 10:00-12:00 | 11:00-13:00 | 계속 → 생성 |
| TC3.1 | 10:00(10-20) | 이동(10-21) | 겹침 O |
| TC3.2 | 10:00(10-20) | 이동(10-21) 취소 | 원래 위치 유지 |
| TC4.1 | 09:00-10:00 | 수정(10:30-11:30) | 겹침 O |

---

## 4. Helper 함수

기존 `event-helpers.ts` 함수 활용:
- `initializeTestData(page)` - 데이터 초기화
- `createTestEvent(page, data)` - 테스트 일정 생성
- `fillEventForm(page, data)` - 폼 입력
- `switchToMonthView(page)` - 월간 뷰 전환

겹침 전용 Helper (필요시):
- `expectOverlapDialogVisible(page)` - 겹침 다이얼로그 확인
- `expectOverlapEventInfo(page, title, date, start, end)` - 겹친 일정 정보 확인
- `dragEventToDate(page, title, targetDate)` - 일정 드래그

---

## 5. 실행 환경 설정

```typescript
test.beforeEach(async ({ page }) => {
  // 브라우저 시간 고정
  await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });

  // 데이터 초기화
  await initializeTestData(page);

  // 페이지 로드
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});
```

---

## 6. 참고 사항

### Playwright 선택자
- 다이얼로그: `page.getByText('일정 겹침 경고')`
- 취소 버튼: `page.getByRole('button', { name: '취소' })`
- 계속 진행: `page.getByRole('button', { name: '계속 진행' })`
- 일정 목록: `page.getByTestId('event-list')`
- 날짜 셀: `page.locator('[data-date="YYYY-MM-DD"]')`

### API 엔드포인트
- `POST /api/events` - 일정 생성
- `PUT /api/events/:id` - 일정 수정
- `GET /api/events` - 일정 조회

### 겹침 감지 로직
```
조건: start1 < end2 AND start2 < end1

예시:
- 14:00-16:00 vs 14:30-15:30 → 겹침 O (완전 포함)
- 14:00-16:00 vs 16:00-18:00 → 겹침 X (경계값)
- 14:00-16:00 vs 12:00-14:00 → 겹침 X (경계값)
```

---

## 7. 체크리스트

구현 시 확인 사항:
- [ ] 각 테스트가 독립적으로 실행되는가?
- [ ] beforeEach에서 데이터 초기화가 정상인가?
- [ ] TC1.1에서 겹침 다이얼로그가 표시되는가?
- [ ] TC1.2, TC1.3에서 경계값 테스트가 정상인가?
- [ ] TC2.1에서 취소 후 일정 미생성 확인되는가?
- [ ] TC2.2에서 계속 진행 후 일정 생성 확인되는가?
- [ ] TC3.1, TC3.2에서 드래그 앤 드롭이 정상인가?
- [ ] TC4.1에서 수정 폼의 겹침 감지가 정상인가?

---

## 다음 단계

이 설계 문서를 바탕으로 다음 작업을 진행합니다:
1. `src/__tests__/e2e/event-overlap-handling.spec.ts` 파일 생성
2. 각 TC를 구현하여 테스트 실행
3. 모든 테스트 PASS 확인
