# E2E Test Design: 검색 및 필터링 (Search and Filtering)

## 코드베이스 분석 결과

### 검색 및 필터링 구조
- **검색 구현**: `useSearch` 훅으로 상태 관리
- **필터링 로직**: `getFilteredEvents` 함수 (클라이언트 측)
- **검색 필드**: 제목(title), 설명(description), 위치(location)
- **날짜 필터**: 현재 뷰(Week/Month)의 날짜 범위 자동 적용
- **실시간 반응**: 검색어 입력 시 즉시 필터링

### 실제 UI 요소 및 Locators
- **검색 입력 필드**: `#search`
- **검색 결과 영역**: `[data-testid="event-list"]`
- **빈 상태 메시지**: `"검색 결과가 없습니다."`
- **뷰 선택 드롭다운**: `[aria-label="뷰 타입 선택"]`
- **일정 항목**: `[data-testid="event-list"]` 내의 각 일정 Box

### 사용자 워크플로우
1. 사용자가 검색어 입력
2. 즉시 필터링 실행 (useSearch 훅의 useMemo)
3. 검색 결과 업데이트 표시
4. 뷰 변경 시 자동으로 날짜 범위 필터 적용

---

## 테스트 시나리오

### TC-SEARCH-01: 제목으로 검색 (성공 케이스)
- **목표**: 검색어로 일정을 정확하게 필터링할 수 있는지 검증
- **사전 조건**:
  - 시간 고정: 2025-10-15 (현재 주: 10/12~10/18)
  - 테스트 데이터 초기화

- **실행 단계**:
  - [ ] 여러 일정 생성
    - 일정 1: 제목 "팀 회의", 날짜 2025-10-15
    - 일정 2: 제목 "점심 약속", 날짜 2025-10-15
    - 일정 3: 제목 "프로젝트 리뷰", 날짜 2025-10-16
  - [ ] API 요청 완료 대기
  - [ ] 검색 입력 필드(`#search`)에 "팀" 입력
  - [ ] 검색 결과 확인

- **예상 결과**:
  - "팀 회의" 일정만 필터링되어 표시됨
  - 다른 일정들은 사라짐

---

### TC-SEARCH-02: 검색 결과 없음 (빈 상태)
- **목표**: 검색 결과가 없을 때 빈 상태 메시지가 표시되는지 검증
- **사전 조건**:
  - 시간 고정: 2025-10-15
  - 여러 일정 생성 (TC-SEARCH-01과 동일)

- **실행 단계**:
  - [ ] 검색 입력 필드(`#search`)에 "존재하지않는검색어" 입력
  - [ ] 결과 확인

- **예상 결과**:
  - "검색 결과가 없습니다." 메시지 표시
  - 일정 항목이 보이지 않음

---

### TC-SEARCH-03: 뷰 변경 시 날짜 범위 필터 적용
- **목표**: 뷰 변경(Week/Month)이 날짜 범위 필터에 올바르게 영향하는지 검증
- **사전 조건**:
  - 시간 고정: 2025-10-15 (수요일)
  - 테스트 데이터 초기화

- **실행 단계**:
  - [ ] 여러 주의 일정 생성
    - 일정 1: "주간 회의", 날짜 2025-10-14 (현재 주)
    - 일정 2: "개인 일정", 날짜 2025-10-21 (다음 주)
  - [ ] API 요청 완료 대기
  - [ ] Week 뷰 선택 (기본값)
  - [ ] "주간 회의"만 표시되는지 확인
  - [ ] Month 뷰 선택
  - [ ] 두 일정 모두 표시되는지 확인 (같은 월이므로)

- **예상 결과**:
  - Week 뷰: 현재 주(10/12~10/18)의 일정만 표시 → "주간 회의" 1개
  - Month 뷰: 현재 월(10월)의 모든 일정 표시 → 2개

---

## 구현 가이드

### Locators
- **검색 입력**: `page.locator('#search')`
- **검색 결과 확인**: `page.getByTestId('event-list')`
- **빈 상태 메시지**: `page.getByText('검색 결과가 없습니다.')`
- **뷰 선택**: `page.locator('[aria-label="뷰 타입 선택"]')`

### 검색 입력 방식
```typescript
// 검색어 입력
await page.locator('#search').fill('검색어');

// 입력 후 자동으로 필터링됨 (onChange 이벤트)
// useMemo에 의해 자동 재계산
```

### 결과 검증 방식
```typescript
// 특정 일정이 표시되는지 확인
await expect(page.getByText('팀 회의')).toBeVisible();

// 빈 상태 확인
await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();

// 일정 개수 확인
const eventCount = await page.locator('[data-testid="event-list"] > div').count();
```

### 기존 헬퍼 함수 사용
- `initializeTestData(page)` - 데이터 초기화
- `createTestEvent(page, eventData)` - 일정 생성
- `waitForEventLoading(page)` - 로딩 완료 대기

### 테스트 데이터
```typescript
const searchTestEvents = [
  {
    title: '팀 회의',
    date: '2025-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '',
    location: '',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    title: '점심 약속',
    date: '2025-10-15',
    startTime: '12:00',
    endTime: '13:00',
    description: '',
    location: '',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
];
```

---

## 테스트 커버리지 요약

| 시나리오 | 검증 항목 | 우선순위 |
|---------|---------|--------|
| TC-SEARCH-01 | 검색어로 일정 필터링 | 🔴 필수 |
| TC-SEARCH-02 | 빈 상태 메시지 표시 | 🔴 필수 |
| TC-SEARCH-03 | 뷰 변경 시 날짜 범위 필터 | 🟡 중요 |

---

## 주의사항

1. **즉시 필터링**: onChange 이벤트로 즉시 필터링되므로 별도 대기 필요 없음
2. **클라이언트 필터링**: API 호출 없이 메모리의 이벤트 배열에서 필터링
3. **대소문자 무시**: 검색은 대소문자를 구분하지 않음
4. **결합 필터링**: 검색어 + 현재 뷰의 날짜 범위가 함께 적용
5. **뷰 기본값**: Week 뷰가 기본값이므로 Month 뷰 테스트 시 명시적 변경 필요
