# 드래그 앤 드롭 기능 테스트 설계 전략

## 개요
이 문서는 `specs/drag-and-drop-feature.md` 명세서를 기반으로 작성된 테스트 설계 전략입니다.
기존 코드베이스의 테스트 패턴을 따르며, YAGNI 원칙에 따라 명세서에 명시된 기능만 테스트합니다.

## 기존 테스트 패턴 분석

### 테스트 구조
```
src/__tests__/
  ├── unit/              # 순수 함수 유닛 테스트
  ├── hooks/             # 커스텀 훅 테스트 (React Testing Library)
  ├── components/        # 컴포넌트 테스트
  ├── integration/       # 통합 테스트 (전체 워크플로우)
  ├── edge-cases/        # 엣지 케이스 테스트
  └── regression/        # 회귀 테스트
```

### 사용 도구
- **Testing Library**: `@testing-library/react`, `@testing-library/user-event`
- **MSW**: HTTP 요청 mocking
- **Vitest**: 테스트 러너
- **Helper 함수**: `setup()`, `saveSchedule()` 등 재사용 가능한 유틸리티

### 난이도 표기
- `easy.*` - 기본적인 단위 테스트
- `medium.*` - 중간 복잡도의 통합 테스트
- `hard.*` - 복잡한 시나리오 테스트 (과제에서 제공 안 함)

## 테스트 범위

### 테스트할 기능 (명세서 기반)
1. **드래그 시작** (onDragStart)
   - 일정 박스를 드래그할 때 이벤트 ID가 저장됨

2. **드롭 처리** (onDrop)
   - 날짜 셀에 드롭 시 날짜만 변경, 시간 유지
   - 빈 셀(day === null)에는 드롭 불가

3. **반복 일정 처리**
   - 드롭 시 RecurringEventDialog 표시
   - "예" 선택 → 단일 일정만 날짜 변경
   - "아니오" 선택 → 반복 시리즈 전체 날짜 변경

4. **겹침 검증**
   - 드롭 시 `findOverlappingEvents` 호출
   - 겹침 발생 시 Overlap Dialog 표시
   - "취소" → 원래 날짜 유지
   - "계속 진행" → 날짜 변경 저장

5. **뷰 간 일관성**
   - 주간 뷰에서 드래그 앤 드롭 동작
   - 월간 뷰에서 드래그 앤 드롭 동작

### 테스트하지 않을 것 (YAGNI)
- ❌ 시각적 피드백 (커서 변경, 드래그 ghost 이미지)
- ❌ 드래그 취소 (ESC 키)
- ❌ 애니메이션 효과
- ❌ 모바일 터치 지원
- ❌ 다중 선택 드래그
- ❌ 드래그 중 미리보기

## 테스트 케이스 설계

### 1. Unit Tests (`src/__tests__/unit/`)

#### 파일: `medium.dragAndDrop.spec.ts`

**목적**: 드래그 앤 드롭 핸들러 함수의 순수 로직 테스트

**테스트 케이스**:

1. **handleDragStart - 이벤트 ID 저장**
   ```typescript
   describe('handleDragStart', () => {
     it('드래그 시작 시 dataTransfer에 이벤트 ID를 저장한다', () => {
       // Given: 드래그 이벤트와 이벤트 ID
       // When: handleDragStart 호출
       // Then: dataTransfer.setData('eventId', id) 호출됨
     });
   });
   ```

2. **handleDrop - 날짜 변경 로직**
   ```typescript
   describe('handleDrop', () => {
     it('드롭 시 이벤트의 날짜만 변경하고 시간은 유지한다', () => {
       // Given: 기존 이벤트 (2025-01-01 10:00-11:00)
       // When: 2025-01-05 셀에 드롭
       // Then: 새 이벤트 (2025-01-05 10:00-11:00)
     });

     it('빈 셀(day === null)에 드롭 시 아무 동작도 하지 않는다', () => {
       // Given: 빈 셀
       // When: 드롭 시도
       // Then: 이벤트 변경 없음
     });
   });
   ```

3. **날짜 추출 로직**
   ```typescript
   describe('extractDateFromDropTarget', () => {
     it('data-date 속성에서 날짜를 추출한다', () => {
       // Given: data-date="2025-01-05" 속성을 가진 요소
       // When: 날짜 추출
       // Then: "2025-01-05" 반환
     });

     it('data-date 속성이 없으면 null을 반환한다', () => {
       // Given: data-date 속성이 없는 요소
       // When: 날짜 추출
       // Then: null 반환
     });
   });
   ```

**복잡도**: Medium (드래그 앤 드롭 로직 테스트)

---

### 2. Integration Tests (`src/__tests__/integration/`)

#### 파일: `medium.dragAndDropWorkflow.spec.tsx`

**목적**: 드래그 앤 드롭 전체 워크플로우 통합 테스트

**테스트 케이스**:

1. **일반 일정 드래그 앤 드롭 - 성공 케이스**
   ```typescript
   describe('일반 일정 드래그 앤 드롭', () => {
     it('일정을 다른 날짜로 드래그하면 날짜만 변경되고 시간은 유지된다', async () => {
       // Given: 2025-01-01 10:00-11:00 일정이 존재
       // When: 2025-01-05 셀로 드래그 앤 드롭
       // Then:
       //   - 일정의 날짜가 2025-01-05로 변경됨
       //   - 시간은 10:00-11:00 유지됨
       //   - PUT /api/events/:id 호출됨
       //   - 성공 토스트 표시
     });
   });
   ```

2. **반복 일정 드래그 - RecurringEventDialog 통합**
   ```typescript
   describe('반복 일정 드래그 앤 드롭', () => {
     it('반복 일정 드롭 시 RecurringEventDialog가 표시된다', async () => {
       // Given: 반복 일정이 존재
       // When: 다른 날짜로 드래그 앤 드롭
       // Then: RecurringEventDialog 다이얼로그 표시
     });

     it('RecurringEventDialog에서 "예" 선택 시 단일 일정만 날짜 변경', async () => {
       // Given: 반복 일정 드래그 후 다이얼로그 표시
       // When: "예" 버튼 클릭
       // Then:
       //   - 해당 일정만 날짜 변경
       //   - PUT /api/events/:id 호출
       //   - repeat.type이 'none'으로 변경
     });

     it('RecurringEventDialog에서 "아니오" 선택 시 전체 반복 시리즈 날짜 변경', async () => {
       // Given: 반복 일정 드래그 후 다이얼로그 표시
       // When: "아니오" 버튼 클릭
       // Then:
       //   - PUT /api/recurring-events/:repeatId 호출
       //   - 모든 반복 일정의 날짜 변경
     });
   });
   ```

3. **겹침 검증 통합**
   ```typescript
   describe('드래그 시 겹침 검증', () => {
     it('드롭한 날짜에 시간이 겹치는 일정이 있으면 Overlap Dialog 표시', async () => {
       // Given:
       //   - A 일정: 2025-01-05 10:00-11:00
       //   - B 일정: 2025-01-01 10:30-11:30
       // When: B 일정을 2025-01-05로 드래그
       // Then: Overlap Dialog 표시
     });

     it('Overlap Dialog에서 "취소" 선택 시 드래그 취소', async () => {
       // Given: 겹침 발생으로 Overlap Dialog 표시
       // When: "취소" 버튼 클릭
       // Then:
       //   - 일정 날짜 변경 안 됨
       //   - API 호출 안 됨
     });

     it('Overlap Dialog에서 "계속 진행" 선택 시 날짜 변경', async () => {
       // Given: 겹침 발생으로 Overlap Dialog 표시
       // When: "계속 진행" 버튼 클릭
       // Then:
       //   - 일정 날짜 변경됨
       //   - PUT /api/events/:id 호출됨
     });
   });
   ```

4. **뷰 간 일관성**
   ```typescript
   describe('주간/월간 뷰 드래그 앤 드롭', () => {
     it('주간 뷰에서 일정을 드래그 앤 드롭할 수 있다', async () => {
       // Given: 주간 뷰로 설정
       // When: 일정을 다른 날짜로 드래그
       // Then: 날짜 변경 성공
     });

     it('월간 뷰에서 일정을 드래그 앤 드롭할 수 있다', async () => {
       // Given: 월간 뷰로 설정
       // When: 일정을 다른 날짜로 드래그
       // Then: 날짜 변경 성공
     });
   });
   ```

**복잡도**: Medium (전체 워크플로우 통합 테스트)

---

### 3. Component Tests (`src/__tests__/components/`)

#### 파일: `medium.CalendarGrid.dragdrop.spec.tsx`

**목적**: 캘린더 그리드의 드래그 앤 드롭 UI 동작 테스트

**테스트 케이스**:

1. **Draggable 속성 확인**
   ```typescript
   describe('Draggable 이벤트 박스', () => {
     it('캘린더 그리드의 일정 박스에 draggable 속성이 true이다', () => {
       // Given: 일정이 표시된 캘린더
       // When: 일정 박스 렌더링
       // Then: draggable={true} 속성 확인
     });

     it('일정 목록(event-list)의 일정 카드는 draggable 속성이 false이다', () => {
       // Given: 일정 목록 렌더링
       // When: 일정 카드 확인
       // Then: draggable={false} 또는 draggable 속성 없음
     });
   });
   ```

2. **Drop Target 확인**
   ```typescript
   describe('Drop Target 날짜 셀', () => {
     it('날짜 셀에 onDragOver, onDrop 핸들러가 있다', () => {
       // Given: 캘린더 그리드 렌더링
       // When: 날짜 셀 확인
       // Then: onDragOver, onDrop 이벤트 핸들러 존재
     });

     it('빈 셀(day === null)에는 드롭 핸들러가 없다', () => {
       // Given: 빈 셀 포함된 캘린더
       // When: 빈 셀 확인
       // Then: 드롭 핸들러 없음 또는 조기 리턴 로직
     });
   });
   ```

3. **data-date 속성 확인**
   ```typescript
   describe('data-date 속성', () => {
     it('날짜 셀에 data-date 속성이 있다', () => {
       // Given: 캘린더 그리드 렌더링
       // When: 날짜 셀 확인
       // Then: data-date="YYYY-MM-DD" 속성 존재
     });
   });
   ```

**복잡도**: Medium (컴포넌트 구조 및 속성 테스트)

---

## 테스트 헬퍼 함수

### 기존 헬퍼 재사용
- `setup()` - ThemeProvider, SnackbarProvider로 래핑된 컴포넌트 렌더링
- `saveSchedule()` - 일정 생성 플로우 자동화
- MSW 핸들러: `setupMockHandlerUpdating()`, `setupMockHandlerCreation()` 등

### 새로운 헬퍼 함수 (필요 시)

#### `dragAndDropEvent()`
```typescript
const dragAndDropEvent = async (
  user: UserEvent,
  eventTitle: string,
  targetDate: string
) => {
  const eventBox = screen.getByText(eventTitle);
  const targetCell = screen.getByTestId(`date-cell-${targetDate}`);

  // fireEvent로 드래그 앤 드롭 시뮬레이션
  fireEvent.dragStart(eventBox);
  fireEvent.drop(targetCell);
};
```

**목적**: 드래그 앤 드롭 동작을 간단하게 시뮬레이션

**참고**: Testing Library의 `userEvent`는 드래그 앤 드롭을 직접 지원하지 않으므로, `fireEvent`를 사용하거나 Playwright E2E 테스트에서 실제 브라우저 드래그 앤 드롭 테스트

---

## MSW Mock 설정

### 기존 핸들러 재사용
- `PUT /api/events/:id` - 일반 일정 업데이트
- `PUT /api/recurring-events/:repeatId` - 반복 일정 전체 업데이트

### 추가 Mock (필요 시 없음)
기존 핸들러로 충분함. 드래그 앤 드롭은 기존 일정 업데이트 API를 사용하므로 새로운 엔드포인트 불필요.

---

## E2E Tests (Playwright) - 선택사항

### 파일: `tests/dragAndDrop.spec.ts`

**목적**: 실제 브라우저에서 HTML5 Drag and Drop API 동작 검증

**테스트 케이스**:

1. **실제 드래그 앤 드롭 동작**
   ```typescript
   test('일정을 다른 날짜로 드래그 앤 드롭할 수 있다', async ({ page }) => {
     // Given: 일정이 있는 캘린더 페이지
     // When: Playwright의 dragAndDrop() 사용
     // Then: 일정 날짜 변경 확인
   });
   ```

2. **반복 일정 드래그 시나리오**
   ```typescript
   test('반복 일정 드래그 시 RecurringEventDialog가 표시된다', async ({ page }) => {
     // Given: 반복 일정
     // When: 드래그 앤 드롭
     // Then: 다이얼로그 표시 확인
   });
   ```

**참고**: E2E 테스트는 P2 우선순위 (선택 사항)

---

## Storybook Stories - 선택사항

### 파일: `src/stories/DragAndDrop.stories.tsx`

**목적**: 시각적 회귀 테스트 및 개발 편의성

**스토리**:

1. **기본 드래그 앤 드롭**
   ```typescript
   export const Default: Story = {
     render: () => <App />,
     play: async ({ canvasElement }) => {
       // 드래그 가능한 일정 표시
     }
   };
   ```

2. **반복 일정 드래그**
   ```typescript
   export const RecurringEventDrag: Story = {
     // 반복 일정이 있는 상태로 렌더링
   };
   ```

**참고**: Storybook은 P2 우선순위 (선택 사항)

---

## 테스트 실행 전략

### 1. 유닛 테스트 (TDD RED 단계)
```bash
pnpm test src/__tests__/unit/medium.dragAndDrop.spec.ts
```
- 드래그 앤 드롭 핸들러 함수만 작성
- 순수 로직만 테스트 (UI 없음)

### 2. 통합 테스트 (TDD GREEN 단계)
```bash
pnpm test src/__tests__/integration/medium.dragAndDropWorkflow.spec.tsx
```
- 전체 워크플로우 구현 후 실행
- MSW 핸들러와 함께 테스트

### 3. 컴포넌트 테스트 (TDD GREEN 단계)
```bash
pnpm test src/__tests__/components/medium.CalendarGrid.dragdrop.spec.tsx
```
- UI 요소에 드래그 앤 드롭 속성 추가 후 실행

### 4. 전체 테스트 실행 (TDD REFACTOR 단계)
```bash
pnpm test
pnpm test:coverage
```
- 모든 기존 테스트가 여전히 통과하는지 확인
- 리팩토링 후에도 GREEN 유지

---

## 성공 기준

### 테스트 커버리지
- ✅ 드래그 시작/드롭 핸들러 로직 100% 커버
- ✅ 반복 일정 처리 로직 100% 커버
- ✅ 겹침 검증 통합 100% 커버
- ✅ 주간/월간 뷰 일관성 검증

### 기존 테스트 보존
- ✅ 모든 기존 테스트 통과 (`pnpm test` 성공)
- ✅ 테스트 커버리지 감소 없음

### 테스트 품질
- ✅ 각 테스트는 독립적으로 실행 가능
- ✅ Given-When-Then 패턴 준수
- ✅ 명확한 테스트 설명 (한글)
- ✅ 불필요한 엣지 케이스 제외 (YAGNI)

---

## 테스트 작성 순서 (TDD Workflow)

1. **STAGE 3 (RED)**: 유닛 테스트 작성 → 실패 확인
   - `medium.dragAndDrop.spec.ts`

2. **STAGE 4 (GREEN)**: 최소 구현 → 유닛 테스트 통과
   - 드래그 핸들러 함수 구현

3. **STAGE 4 (GREEN)**: 통합 테스트 작성 및 구현
   - `medium.dragAndDropWorkflow.spec.tsx`
   - 전체 워크플로우 구현

4. **STAGE 4 (GREEN)**: 컴포넌트 테스트 작성 및 구현
   - `medium.CalendarGrid.dragdrop.spec.tsx`
   - UI에 드래그 앤 드롭 속성 추가

5. **STAGE 5 (REFACTOR)**: 코드 품질 개선
   - 중복 코드 제거
   - 기존 패턴과 일관성 유지
   - 모든 테스트 GREEN 유지

---

## 제약사항 및 예외 처리

### 제약사항
- HTML5 Drag and Drop API만 사용 (외부 라이브러리 NO)
- 기존 `RecurringEventDialog`, Overlap Dialog 재사용
- 기존 API 엔드포인트 재사용 (새 엔드포인트 NO)

### 예외 처리
- 빈 셀(day === null) 드롭 → 무시
- data-date 속성 없는 셀 → 무시
- 드래그 중 오류 → 상태 초기화

---

## 참고 자료

### 기존 테스트 파일
- `src/__tests__/medium.integration.spec.tsx` - 통합 테스트 패턴
- `src/__tests__/hooks/useRecurringEventOperations.spec.ts` - 반복 일정 로직 테스트
- `src/__tests__/integration/recurringEventWorkflow.spec.tsx` - 반복 일정 워크플로우 테스트

### 명세서
- `specs/drag-and-drop-feature.md` - 드래그 앤 드롭 기능 명세서

---

## 승인 정보
- **작성일**: 2025-11-02
- **기반 명세서**: `specs/drag-and-drop-feature.md` (승인 완료)
- **대상 단계**: STAGE 2 (Test Design Strategy)
