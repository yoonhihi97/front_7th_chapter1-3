# E2E Test Design: 기본 일정 관리 CRUD 워크플로우

## 1. 테스트 목표

- 사용자가 브라우저에서 일정 CRUD 작업을 수행할 때 정상적으로 동작하는지 검증
- 실제 서버(Express)와 프론트엔드(React) 통합 환경에서 전체 워크플로우 검증
- 폼 검증, 에러 처리, UI 업데이트 등 사용자 경험 검증
- 기본 일정 관리 기능만 테스트 (반복 일정, 드래그 앤 드롭 제외)

## 2. 코드베이스 분석 결과

### 2.1 애플리케이션 구조

- **진입점**: `/Users/seednpc54/Documents/GitHub/front_7th_chapter1-3/src/App.tsx`
- **백엔드 서버**: `/Users/seednpc54/Documents/GitHub/front_7th_chapter1-3/server.js` (Express, Port 3000)
- **프론트엔드**: Vite Dev Server (Port 5173)
- **데이터 저장소**: `src/__mocks__/response/e2e.json` (TEST_ENV=e2e 환경)

### 2.2 실제 UI 요소 및 로케이터

#### 폼 필드 (Form Fields):
- **제목 입력**: `page.getByLabelText('제목')` (TextField, id="title")
- **날짜 입력**: `page.getByLabelText('날짜')` (TextField, id="date", type="date")
- **시작 시간 입력**: `page.getByLabelText('시작 시간')` (TextField, id="start-time", type="time")
- **종료 시간 입력**: `page.getByLabelText('종료 시간')` (TextField, id="end-time", type="time")
- **설명 입력**: `page.getByLabelText('설명')` (TextField, id="description")
- **위치 입력**: `page.getByLabelText('위치')` (TextField, id="location")
- **카테고리 선택**: `page.getByLabelText('카테고리')` (Select, id="category")
  - 옵션: '업무', '개인', '가족', '기타'
- **제출 버튼**: `page.getByTestId('event-submit-button')` (Button with data-testid)

#### 일정 목록 (Event List):
- **일정 목록 컨테이너**: `page.getByTestId('event-list')` (Stack with data-testid)
- **수정 버튼**: `page.getByLabelText('Edit event')` (IconButton with aria-label)
- **삭제 버튼**: `page.getByLabelText('Delete event')` (IconButton with aria-label)
- **일정 제목**: `page.getByText('[일정 제목]')` (Typography)
- **일정 날짜**: `page.getByText('[날짜]')` (Typography, format: YYYY-MM-DD)
- **일정 시간**: `page.getByText('[시작 시간] - [종료 시간]')` (Typography)

#### 에러 메시지:
- Snackbar 알림: `page.getByText('필수 정보를 모두 입력해주세요.')` (notistack)
- 시간 검증 에러: `page.getByText('시간 설정을 확인해주세요.')` (notistack)

### 2.3 API 엔드포인트 (server.js)

- `GET /api/events` - 전체 일정 목록 조회
- `POST /api/events` - 새 일정 생성 (응답: 201, 생성된 Event 객체)
- `PUT /api/events/:id` - 기존 일정 수정 (응답: 200, 수정된 Event 객체)
- `DELETE /api/events/:id` - 일정 삭제 (응답: 204)

### 2.4 실제 사용자 워크플로우

1. **일정 생성**: 폼 입력 → "일정 추가" 버튼 클릭 → 일정 목록에 표시
2. **일정 조회**: 일정 목록에서 생성된 일정 확인 (제목, 날짜, 시간, 설명 등)
3. **일정 수정**: 수정 버튼 클릭 → 폼에 기존 데이터 로드 → 수정 → "일정 수정" 버튼 클릭
4. **일정 삭제**: 삭제 버튼 클릭 → 일정 목록에서 제거

## 3. 테스트 데이터 초기화 전략

### 3.1 기존 유닛 테스트 패턴 분석

기존 유닛/통합 테스트는 다음 전략을 사용합니다:
- **beforeEach**: 시스템 시간을 `2025-10-01`로 고정 (`vi.setSystemTime`)
- **각 테스트**: MSW를 사용하여 필요한 Mock 데이터를 명시적으로 설정
  - `setupMockHandlerCreation()`: 빈 이벤트 배열로 시작
  - `setupMockHandlerUpdating(initEvents)`: 초기 이벤트 배열 제공
  - `setupMockHandlerDeletion()`: 삭제할 이벤트 미리 설정

### 3.2 E2E 테스트 초기화 전략 (결정)

E2E 테스트는 **실제 서버와 데이터 파일**을 사용하므로, 다음 전략을 적용합니다:

1. **beforeEach (전역 설정)**:
   - 브라우저 시간을 고정 (`await page.clock.install()`, `await page.clock.setSystemTime(new Date('2025-10-01'))`)
   - e2e.json 파일을 빈 배열로 초기화 (API를 통해 또는 직접 파일 수정)

2. **각 테스트 (테스트별 설정)**:
   - **생성 테스트**: 초기 데이터 없이 시작 (e2e.json = `{"events":[]}`)
   - **조회/수정/삭제 테스트**: 테스트 시작 전 필요한 이벤트를 API로 생성
     - 예: `await createTestEvent({ title: '기존 회의', date: '2025-10-15', ... })`
   - 테스트 종료 시 명시적 정리 불필요 (beforeEach에서 전역 초기화)

3. **데이터 격리**:
   - 각 테스트는 독립적으로 실행되며, 다른 테스트의 데이터에 영향을 받지 않음
   - Playwright의 `workers: 1` 설정으로 테스트 순차 실행 보장

## 4. 주요 테스트 시나리오

### 시나리오 1: 일정 생성 (Create)

**목표**: 모든 필드를 입력하여 새 일정을 생성하고 목록에 표시되는지 확인

#### 테스트 케이스:

**TC1.1: 정상적인 일정 생성 (Happy Path)**

- **준비 (Arrange)**:
  - 브라우저 시간 고정: `2025-10-01`
  - e2e.json 초기화: `{"events":[]}`
  - 페이지 로드: `await page.goto('/')`

- **실행 (Act)**:
  ```typescript
  await page.getByLabelText('제목').fill('팀 회의');
  await page.getByLabelText('날짜').fill('2025-10-15');
  await page.getByLabelText('시작 시간').fill('14:00');
  await page.getByLabelText('종료 시간').fill('15:00');
  await page.getByLabelText('설명').fill('프로젝트 진행 상황 논의');
  await page.getByLabelText('위치').fill('회의실 A');
  await page.getByLabelText('카테고리').click();
  await page.getByRole('option', { name: '업무' }).click();
  await page.getByTestId('event-submit-button').click();
  ```

- **검증 (Assert)**:
  ```typescript
  // 일정 목록에 새 일정 표시 확인
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('팀 회의')).toBeVisible();
  await expect(eventList.getByText('2025-10-15')).toBeVisible();
  await expect(eventList.getByText('14:00 - 15:00')).toBeVisible();
  await expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeVisible();
  await expect(eventList.getByText('회의실 A')).toBeVisible();
  await expect(eventList.getByText('카테고리: 업무')).toBeVisible();

  // 폼이 초기화되었는지 확인
  await expect(page.getByLabelText('제목')).toHaveValue('');
  ```

**TC1.2: 필수 필드 검증 - 제목 누락**

- **준비**: TC1.1과 동일

- **실행**:
  ```typescript
  // 제목을 입력하지 않고 다른 필드만 입력
  await page.getByLabelText('날짜').fill('2025-10-15');
  await page.getByLabelText('시작 시간').fill('14:00');
  await page.getByLabelText('종료 시간').fill('15:00');
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  // 에러 메시지 표시 확인
  await expect(page.getByText('필수 정보를 모두 입력해주세요.')).toBeVisible();

  // 일정 목록에 추가되지 않았는지 확인
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('2025-10-15')).not.toBeVisible();
  ```

**TC1.3: 시간 검증 - 종료 시간이 시작 시간보다 이름**

- **준비**: TC1.1과 동일

- **실행**:
  ```typescript
  await page.getByLabelText('제목').fill('잘못된 시간 일정');
  await page.getByLabelText('날짜').fill('2025-10-15');
  await page.getByLabelText('시작 시간').fill('15:00');
  await page.getByLabelText('종료 시간').fill('14:00'); // 시작 시간보다 이름
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  // 시간 에러 메시지 표시 (Tooltip 또는 Snackbar)
  await expect(page.getByText('시간 설정을 확인해주세요.')).toBeVisible();

  // 일정 목록에 추가되지 않았는지 확인
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('잘못된 시간 일정')).not.toBeVisible();
  ```

**TC1.4: 필수 필드 검증 - 날짜 누락**

- **준비**: TC1.1과 동일

- **실행**:
  ```typescript
  await page.getByLabelText('제목').fill('날짜 없는 일정');
  await page.getByLabelText('시작 시간').fill('14:00');
  await page.getByLabelText('종료 시간').fill('15:00');
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  await expect(page.getByText('필수 정보를 모두 입력해주세요.')).toBeVisible();
  ```

**TC1.5: 최소 필드로 일정 생성 (제목, 날짜, 시간만)**

- **준비**: TC1.1과 동일

- **실행**:
  ```typescript
  await page.getByLabelText('제목').fill('간단한 일정');
  await page.getByLabelText('날짜').fill('2025-10-16');
  await page.getByLabelText('시작 시간').fill('10:00');
  await page.getByLabelText('종료 시간').fill('11:00');
  // 설명, 위치는 입력하지 않음
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('간단한 일정')).toBeVisible();
  await expect(eventList.getByText('2025-10-16')).toBeVisible();
  await expect(eventList.getByText('10:00 - 11:00')).toBeVisible();
  ```

---

### 시나리오 2: 일정 조회 (Read)

**목표**: 생성된 일정이 정확하게 조회되고 표시되는지 확인

#### 테스트 케이스:

**TC2.1: 일정 목록에서 생성된 일정 확인**

- **준비**:
  - e2e.json 초기화
  - 테스트 일정 미리 생성:
    ```typescript
    const response = await page.request.post('http://localhost:3000/api/events', {
      data: {
        title: '점심 약속',
        date: '2025-10-15',
        startTime: '12:00',
        endTime: '13:00',
        description: '팀원들과 점심',
        location: '강남역 레스토랑',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      }
    });
    const createdEvent = await response.json();
    ```
  - 페이지 로드: `await page.goto('/')`

- **실행**: (사용자 액션 없음, 페이지 로드 시 자동 조회)

- **검증**:
  ```typescript
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('점심 약속')).toBeVisible();
  await expect(eventList.getByText('2025-10-15')).toBeVisible();
  await expect(eventList.getByText('12:00 - 13:00')).toBeVisible();
  await expect(eventList.getByText('팀원들과 점심')).toBeVisible();
  await expect(eventList.getByText('강남역 레스토랑')).toBeVisible();
  await expect(eventList.getByText('카테고리: 개인')).toBeVisible();
  ```

**TC2.2: 여러 일정 조회 (다중 일정 표시)**

- **준비**:
  - e2e.json 초기화
  - 3개의 테스트 일정 미리 생성:
    ```typescript
    await page.request.post('http://localhost:3000/api/events', { data: event1 });
    await page.request.post('http://localhost:3000/api/events', { data: event2 });
    await page.request.post('http://localhost:3000/api/events', { data: event3 });
    ```
  - 페이지 로드

- **검증**:
  ```typescript
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('일정 1')).toBeVisible();
  await expect(eventList.getByText('일정 2')).toBeVisible();
  await expect(eventList.getByText('일정 3')).toBeVisible();
  ```

**TC2.3: 일정이 없을 때 빈 상태 확인**

- **준비**:
  - e2e.json 초기화 (빈 배열)
  - 페이지 로드

- **검증**:
  ```typescript
  // 일정 목록은 비어 있어야 함 (또는 "검색 결과가 없습니다." 메시지)
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('검색 결과가 없습니다.')).toBeVisible();
  ```

---

### 시나리오 3: 일정 수정 (Update)

**목표**: 일정을 수정하고 변경사항이 반영되는지 확인

#### 테스트 케이스:

**TC3.1: 제목만 수정**

- **준비**:
  - 기존 일정 생성:
    ```typescript
    const response = await page.request.post('http://localhost:3000/api/events', {
      data: {
        title: '기존 회의',
        date: '2025-10-20',
        startTime: '14:00',
        endTime: '15:00',
        description: '기존 설명',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      }
    });
    ```
  - 페이지 로드

- **실행**:
  ```typescript
  // 수정 버튼 클릭
  await page.getByLabelText('Edit event').click();

  // 폼에 기존 데이터가 로드되었는지 확인
  await expect(page.getByLabelText('제목')).toHaveValue('기존 회의');

  // 제목 수정
  await page.getByLabelText('제목').clear();
  await page.getByLabelText('제목').fill('수정된 회의');

  // 저장 버튼 클릭 (버튼 텍스트가 "일정 수정"으로 변경됨)
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('수정된 회의')).toBeVisible();
  await expect(eventList.getByText('기존 회의')).not.toBeVisible();

  // 다른 필드는 그대로 유지
  await expect(eventList.getByText('2025-10-20')).toBeVisible();
  await expect(eventList.getByText('14:00 - 15:00')).toBeVisible();
  ```

**TC3.2: 여러 필드 동시 수정 (제목, 날짜, 시간)**

- **준비**: TC3.1과 동일한 기존 일정 생성

- **실행**:
  ```typescript
  await page.getByLabelText('Edit event').click();

  // 여러 필드 수정
  await page.getByLabelText('제목').clear();
  await page.getByLabelText('제목').fill('완전히 새로운 회의');
  await page.getByLabelText('날짜').fill('2025-10-25');
  await page.getByLabelText('시작 시간').fill('10:00');
  await page.getByLabelText('종료 시간').fill('11:00');
  await page.getByLabelText('설명').clear();
  await page.getByLabelText('설명').fill('변경된 설명');

  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('완전히 새로운 회의')).toBeVisible();
  await expect(eventList.getByText('2025-10-25')).toBeVisible();
  await expect(eventList.getByText('10:00 - 11:00')).toBeVisible();
  await expect(eventList.getByText('변경된 설명')).toBeVisible();
  ```

**TC3.3: 수정 중 필수 필드 검증 (제목 삭제 시도)**

- **준비**: TC3.1과 동일

- **실행**:
  ```typescript
  await page.getByLabelText('Edit event').click();

  // 제목을 비우고 저장 시도
  await page.getByLabelText('제목').clear();
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  await expect(page.getByText('필수 정보를 모두 입력해주세요.')).toBeVisible();

  // 기존 일정은 그대로 유지
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('기존 회의')).toBeVisible();
  ```

**TC3.4: 수정 중 시간 검증 (종료 시간을 시작 시간보다 이르게 변경)**

- **준비**: TC3.1과 동일

- **실행**:
  ```typescript
  await page.getByLabelText('Edit event').click();

  // 종료 시간을 시작 시간보다 이르게 설정
  await page.getByLabelText('종료 시간').fill('13:00'); // 시작 시간은 14:00
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  await expect(page.getByText('시간 설정을 확인해주세요.')).toBeVisible();
  ```

---

### 시나리오 4: 일정 삭제 (Delete)

**목표**: 일정을 삭제하고 목록에서 제거되는지 확인

#### 테스트 케이스:

**TC4.1: 일정 삭제 확인**

- **준비**:
  - 삭제할 일정 생성:
    ```typescript
    await page.request.post('http://localhost:3000/api/events', {
      data: {
        title: '삭제할 일정',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '삭제 테스트',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      }
    });
    ```
  - 페이지 로드

- **실행**:
  ```typescript
  // 삭제 버튼 클릭
  await page.getByLabelText('Delete event').click();
  ```

- **검증**:
  ```typescript
  // 일정이 목록에서 제거되었는지 확인
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('삭제할 일정')).not.toBeVisible();

  // 빈 상태 메시지 표시 (일정이 더 이상 없는 경우)
  await expect(eventList.getByText('검색 결과가 없습니다.')).toBeVisible();
  ```

**TC4.2: 여러 일정 중 하나만 삭제**

- **준비**:
  - 3개의 일정 생성:
    ```typescript
    await page.request.post('http://localhost:3000/api/events', { data: event1 });
    await page.request.post('http://localhost:3000/api/events', { data: event2 });
    await page.request.post('http://localhost:3000/api/events', { data: event3 });
    ```
  - 페이지 로드

- **실행**:
  ```typescript
  // 두 번째 일정의 삭제 버튼 클릭 (nth(1)로 특정 일정 선택)
  await page.getByLabelText('Delete event').nth(1).click();
  ```

- **검증**:
  ```typescript
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('일정 1')).toBeVisible();
  await expect(eventList.getByText('일정 2')).not.toBeVisible(); // 삭제됨
  await expect(eventList.getByText('일정 3')).toBeVisible();
  ```

---

## 5. 에러 케이스 테스트

### EC1: 일정 겹침 경고 (Overlap Dialog)

**목표**: 시간이 겹치는 일정 생성 시 경고 다이얼로그 표시 확인

- **준비**:
  - 기존 일정 생성:
    ```typescript
    await page.request.post('http://localhost:3000/api/events', {
      data: {
        title: '기존 일정',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      }
    });
    ```

- **실행**:
  ```typescript
  // 겹치는 시간대의 새 일정 생성 시도
  await page.getByLabelText('제목').fill('겹치는 일정');
  await page.getByLabelText('날짜').fill('2025-10-15');
  await page.getByLabelText('시작 시간').fill('14:30');
  await page.getByLabelText('종료 시간').fill('15:30');
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  // 겹침 경고 다이얼로그 표시
  await expect(page.getByText('일정 겹침 경고')).toBeVisible();
  await expect(page.getByText('다음 일정과 겹칩니다:')).toBeVisible();
  await expect(page.getByText('기존 일정 (2025-10-15 14:00-15:00)')).toBeVisible();

  // "취소" 버튼 클릭 시 일정 생성 취소
  await page.getByRole('button', { name: '취소' }).click();
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('겹치는 일정')).not.toBeVisible();
  ```

- **추가 검증 (계속 진행 시)**:
  ```typescript
  // 다시 생성 시도
  await page.getByTestId('event-submit-button').click();
  await page.getByRole('button', { name: '계속 진행' }).click();

  // 일정이 생성되었는지 확인
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('겹치는 일정')).toBeVisible();
  ```

### EC2: 네트워크 오류 처리 (서버 연결 실패)

**목표**: 백엔드 서버 오류 시 적절한 에러 메시지 표시

- **준비**:
  - 서버 응답을 500 에러로 모킹 (Playwright의 `page.route` 사용)
    ```typescript
    await page.route('**/api/events', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    ```
  - 페이지 로드

- **실행**:
  ```typescript
  await page.getByLabelText('제목').fill('테스트 일정');
  await page.getByLabelText('날짜').fill('2025-10-15');
  await page.getByLabelText('시작 시간').fill('14:00');
  await page.getByLabelText('종료 시간').fill('15:00');
  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  // 에러 메시지 표시 (Snackbar 또는 에러 다이얼로그)
  await expect(page.getByText(/오류가 발생했습니다|실패/)).toBeVisible();
  ```

### EC3: 카테고리 선택 검증

**목표**: 카테고리 선택 시 정상 작동 확인

- **실행**:
  ```typescript
  await page.getByLabelText('제목').fill('카테고리 테스트');
  await page.getByLabelText('날짜').fill('2025-10-15');
  await page.getByLabelText('시작 시간').fill('14:00');
  await page.getByLabelText('종료 시간').fill('15:00');

  // 카테고리 선택
  await page.getByLabelText('카테고리').click();
  await page.getByRole('option', { name: '가족' }).click();

  await page.getByTestId('event-submit-button').click();
  ```

- **검증**:
  ```typescript
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('카테고리: 가족')).toBeVisible();
  ```

---

## 6. 테스트 환경 및 데이터 전략

### 6.1 초기화 전략 (beforeEach/beforeAll)

**전역 설정 (test.beforeEach)**:
```typescript
test.beforeEach(async ({ page }) => {
  // 1. 브라우저 시간 고정
  await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });

  // 2. e2e.json 파일 초기화 (빈 이벤트 배열)
  await page.request.delete('http://localhost:3000/api/events-list', {
    data: { eventIds: [] } // 또는 직접 파일 수정
  });
  // 대안: 서버에 초기화 API 추가하여 호출

  // 3. 페이지 로드
  await page.goto('/');

  // 4. 일정 로딩 완료 대기 (선택적)
  await page.waitForLoadState('networkidle');
});
```

### 6.2 테스트 데이터 예시

**새 일정 생성용 데이터**:
```typescript
const newEvent = {
  title: '팀 회의',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '프로젝트 진행 상황 논의',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};
```

**수정/삭제 테스트용 초기 일정**:
```typescript
const existingEvent = {
  title: '기존 회의',
  date: '2025-10-20',
  startTime: '09:00',
  endTime: '10:00',
  description: '기존 팀 미팅',
  location: '회의실 B',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

// API로 생성
const response = await page.request.post('http://localhost:3000/api/events', {
  data: existingEvent
});
const createdEvent = await response.json();
```

### 6.3 테스트 격리 및 순서

- **독립성**: 각 테스트는 beforeEach에서 초기화된 깨끗한 상태에서 시작
- **순서**: Playwright의 `workers: 1` 설정으로 테스트 순차 실행
- **데이터 의존성 없음**: 각 테스트는 필요한 데이터를 직접 생성

---

## 7. 기대 결과 및 단언 (Assertion)

### 7.1 각 테스트에서 확인할 사항

#### 일정 생성 (Create):
- ✅ 일정이 일정 목록에 표시되는가?
- ✅ 모든 입력 필드 값이 정확하게 저장되었는가?
- ✅ 폼이 초기화되었는가?
- ✅ 필수 필드 누락 시 적절한 에러 메시지가 표시되는가?
- ✅ 시간 검증 실패 시 적절한 에러 메시지가 표시되는가?

#### 일정 조회 (Read):
- ✅ 생성된 일정이 일정 목록에 표시되는가?
- ✅ 일정의 모든 정보(제목, 날짜, 시간, 설명 등)가 정확하게 표시되는가?
- ✅ 여러 일정이 있을 때 모두 표시되는가?
- ✅ 일정이 없을 때 빈 상태 메시지가 표시되는가?

#### 일정 수정 (Update):
- ✅ 수정 버튼 클릭 시 폼에 기존 데이터가 로드되는가?
- ✅ 수정된 값이 일정 목록에 반영되는가?
- ✅ 수정 시 필수 필드 검증이 작동하는가?
- ✅ 수정 시 시간 검증이 작동하는가?

#### 일정 삭제 (Delete):
- ✅ 삭제 버튼 클릭 시 일정이 목록에서 제거되는가?
- ✅ 여러 일정 중 하나만 삭제되는가? (다른 일정은 유지)
- ✅ 모든 일정 삭제 시 빈 상태 메시지가 표시되는가?

#### 에러 케이스:
- ✅ 일정 겹침 시 경고 다이얼로그가 표시되는가?
- ✅ 네트워크 오류 시 적절한 에러 메시지가 표시되는가?
- ✅ 카테고리 선택이 정상 작동하는가?

### 7.2 Playwright Assertion 예시

```typescript
// 요소 가시성 확인
await expect(page.getByText('팀 회의')).toBeVisible();

// 입력 필드 값 확인
await expect(page.getByLabelText('제목')).toHaveValue('팀 회의');

// 요소가 없음을 확인
await expect(page.getByText('삭제된 일정')).not.toBeVisible();

// 다이얼로그 표시 확인
await expect(page.getByRole('dialog')).toBeVisible();

// 버튼 활성화 상태 확인
await expect(page.getByTestId('event-submit-button')).toBeEnabled();

// 특정 수의 요소 존재 확인
await expect(page.getByLabelText('Delete event')).toHaveCount(3);
```

---

## 8. 구현 시 주의사항

### 8.1 Playwright 특화 고려사항

1. **비동기 처리**:
   - 모든 Playwright 액션과 단언은 `await` 사용
   - 네트워크 요청 완료 대기: `await page.waitForLoadState('networkidle')`

2. **로케이터 안정성**:
   - `getByLabelText`, `getByTestId`, `getByRole` 등 의미론적 로케이터 우선 사용
   - CSS 선택자나 XPath는 최소화

3. **타이밍 이슈**:
   - Playwright의 자동 대기(auto-wait) 활용
   - 필요시 명시적 대기: `await page.waitForSelector('[data-testid="event-list"]')`

4. **브라우저 시간 고정**:
   - `page.clock.install()`과 `page.clock.setSystemTime()` 사용
   - 알림 기능 테스트 시 시간 조작 필요

### 8.2 데이터 초기화 베스트 프랙티스

1. **beforeEach에서 전역 초기화**:
   - e2e.json을 빈 배열로 설정
   - 모든 테스트가 깨끗한 상태에서 시작

2. **테스트별 데이터 설정**:
   - API를 통해 필요한 초기 데이터 생성
   - 헬퍼 함수 활용: `createTestEvent()`

3. **명시적 정리 불필요**:
   - beforeEach에서 전역 초기화하므로 afterEach 정리 불필요

### 8.3 에러 처리 및 디버깅

1. **스크린샷 및 비디오**:
   - 실패 시 자동 스크린샷/비디오 녹화 (playwright.config.ts 설정)
   - `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`

2. **네트워크 모니터링**:
   - `page.on('request')`, `page.on('response')` 이벤트 리스너 활용

3. **로깅**:
   - 중요한 단계마다 콘솔 로그 출력 (디버깅용)

### 8.4 테스트 가독성 및 유지보수

1. **헬퍼 함수 작성**:
   - 반복되는 패턴(일정 생성, 폼 입력)을 함수로 추상화
   - 예: `fillEventForm()`, `createTestEvent()`, `verifyEventInList()`

2. **명확한 테스트 이름**:
   - `test('TC1.1: 정상적인 일정 생성', async ({ page }) => { ... })`

3. **주석 추가**:
   - 복잡한 로직이나 특정 대기 시간이 필요한 이유 설명

### 8.5 CI/CD 통합

1. **재시도 설정**:
   - `playwright.config.ts`에서 `retries: 2` 설정 (CI 환경)

2. **병렬 실행 제한**:
   - `workers: 1`로 설정하여 데이터 격리 보장

3. **테스트 환경 변수**:
   - `TEST_ENV=e2e`로 서버 실행하여 e2e.json 사용

---

## 9. 다음 단계 (Next Steps)

이 설계 문서를 기반으로 Playwright 테스트 코드를 작성할 수 있습니다:

1. **테스트 파일 생성**: `src/__tests__/e2e/event-crud.spec.ts`
2. **헬퍼 함수 작성**: `src/__tests__/e2e/helpers/event-helpers.ts`
3. **테스트 실행**: `pnpm exec playwright test`
4. **리포트 확인**: `pnpm exec playwright show-report`

---

## 10. 참고 문서

- [Playwright 공식 문서](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright API Testing](https://playwright.dev/docs/api-testing)
