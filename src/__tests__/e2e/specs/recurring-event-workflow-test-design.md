# E2E Test Design: 반복 일정 관리 워크플로우

## 코드베이스 분석 결과

### Application Structure
- **Main Component**: `src/App.tsx` - 전체 달력 UI 및 이벤트 관리 폼
- **Dialog Component**: `src/components/RecurringEventDialog.tsx` - "단일 vs 전체" 선택 다이얼로그
- **Hooks**: `useRecurringEventOperations` - 반복 일정 편집/삭제 로직
- **API Server**: `server.js` - REST API 엔드포인트 관리
- **Test Database**: `src/__mocks__/response/e2e.json` - E2E 테스트 데이터

### Actual UI Elements and Locators
| Element | Locator | Test ID |
|---------|---------|---------|
| Repeat Checkbox | `page.locator('input[type="checkbox"][name="repeat"]')` | None |
| Repeat Type Select | `page.locator('#repeat-type')` | None |
| Repeat Interval Input | `page.locator('#repeat-interval')` | None |
| Repeat End Date Input | `page.locator('#repeat-end-date')` | None |
| Submit Button | `page.getByTestId('event-submit-button')` | `event-submit-button` |
| Event List Container | `page.getByTestId('event-list')` | `event-list` |
| Edit Button (first event) | `page.locator('button[aria-label="Edit event"]').first()` | None |
| Delete Button (first event) | `page.locator('button[aria-label="Delete event"]').first()` | None |
| Dialog Cancel Button | `page.getByRole('button', { name: '취소' })` | None |
| Dialog Single Edit/Delete Button (Yes) | `page.getByRole('button', { name: '예' })` | None |
| Dialog Series Edit/Delete Button (No) | `page.getByRole('button', { name: '아니오' })` | None |

### User Workflows
1. **반복 일정 생성**: 폼에서 반복 설정 → 일정 추가
2. **반복 일정 조회**: 달력에서 반복 아이콘 확인 → 이벤트 목록에서 반복 정보 표시
3. **반복 일정 편집 - 단일**: 이벤트 편집 → "예" 선택 → 해당 일정만 수정
4. **반복 일정 편집 - 전체**: 이벤트 편집 → "아니오" 선택 → 시리즈 전체 수정
5. **반복 일정 삭제 - 단일**: 이벤트 삭제 → "예" 선택 → 해당 일정만 삭제
6. **반복 일정 삭제 - 전체**: 이벤트 삭제 → "아니오" 선택 → 시리즈 전체 삭제
7. **반복 일정 드래그**: 이벤트 드래그 → "단일" 또는 "전체" 선택 → 날짜 변경

### API Endpoints
- **POST `/api/events-list`**: 반복 일정 생성 (여러 인스턴스)
- **PUT `/api/recurring-events/:repeatId`**: 반복 일정 시리즈 수정
- **DELETE `/api/recurring-events/:repeatId`**: 반복 일정 시리즈 삭제
- **PUT `/api/events/:id`**: 단일 일정 수정
- **DELETE `/api/events/:id`**: 단일 일정 삭제

---

## 테스트 시나리오

### 시나리오 1: 반복 일정 생성 (Create Recurring)

#### TC1.1: 일일 반복 일정 생성
```gherkin
Given: 빈 캘린더 상태
When:
  1. 폼에 다음 정보 입력:
     - 제목: "매일 회의"
     - 날짜: 2025-10-15
     - 시작시간: 09:00
     - 종료시간: 10:00
     - 반복: 체크됨
     - 반복 유형: 매일
     - 반복 간격: 1
     - 종료일: 2025-10-20
  2. "일정 추가" 버튼 클릭
Then:
  1. API POST /api/events-list 호출 확인
  2. 5개의 일정이 생성됨 (2025-10-15 ~ 2025-10-20)
  3. 모든 일정이 동일한 repeatId 공유
  4. 이벤트 목록에 반복 아이콘 표시
  5. 툴팁에 "1일마다 반복 (종료: 2025-10-20)" 표시

Locators:
- Repeat Checkbox: `page.locator('input[type="checkbox"]').filter({ has: page.locator('text=반복 일정') })`
- Repeat Type Select: `page.locator('#repeat-type')`
- Repeat Interval: `page.locator('#repeat-interval')`
- Repeat End Date: `page.locator('#repeat-end-date')`
- Submit: `page.getByTestId('event-submit-button')`
- Event List: `page.getByTestId('event-list')`
- Repeat Icon: `page.locator('svg[data-testid="RepeatIcon"]')`
```

#### TC1.2: 주간 반복 일정 생성 (interval=2)
```gherkin
Given: 빈 캘린더 상태
When:
  1. 폼에 다음 정보 입력:
     - 제목: "격주 팀 미팅"
     - 날짜: 2025-10-15
     - 시작시간: 14:00
     - 종료시간: 15:00
     - 반복: 체크됨
     - 반복 유형: 매주
     - 반복 간격: 2
     - 종료일: 2025-11-30
  2. "일정 추가" 버튼 클릭
Then:
  1. API POST /api/events-list 호출 확인
  2. 약 4개의 일정이 생성됨 (2주 간격)
  3. 날짜 차이가 정확히 14일 (2주)
  4. 이벤트 목록에 "반복: 2주마다 (종료: 2025-11-30)" 표시

Locators:
- Repeat Type Select 옵션: `page.getByRole('option', { name: '매주' })`
- Repeat Interval Input: `page.locator('#repeat-interval')`
```

#### TC1.3: 월간 반복 일정 생성
```gherkin
Given: 빈 캘린더 상태
When:
  1. 폼에 다음 정보 입력:
     - 제목: "월간 결산"
     - 날짜: 2025-10-15
     - 반복: 체크됨
     - 반복 유형: 매월
     - 반복 간격: 1
     - 종료일: 2025-12-31
  2. "일정 추가" 버튼 클릭
Then:
  1. API POST /api/events-list 호출 확인
  2. 3개의 일정이 생성됨 (10월 15, 11월 15, 12월 15)
  3. 모든 일정이 각 월의 15일 유지

Locators:
- Repeat Type Option: `page.getByRole('option', { name: '매월' })`
```

#### TC1.4: 연간 반복 일정 생성
```gherkin
Given: 빈 캘린더 상태
When:
  1. 폼에 다음 정보 입력:
     - 제목: "연간 회사 설립일"
     - 날짜: 2025-10-01
     - 반복: 체크됨
     - 반복 유형: 매년
     - 반복 간격: 1
     - 종료일: 2027-12-31
  2. "일정 추가" 버튼 클릭
Then:
  1. API POST /api/events-list 호출 확인
  2. 3개의 일정이 생성됨 (2025-10, 2026-10, 2027-10)

Locators:
- Repeat Type Option: `page.getByRole('option', { name: '매년' })`
```

#### TC1.5: 반복 일정 생성 후 폼 초기화
```gherkin
Given: 반복 일정 생성 완료
When: 자동으로 폼이 초기화됨
Then:
  1. 모든 입력 필드가 비워짐
  2. 반복 체크박스 해제됨
  3. 새로운 일정 입력 가능

Locators:
- Title Input: `page.locator('#title')`
- Date Input: `page.locator('#date')`
```

#### TC1.6: 반복 일정 종료일 없이 생성
```gherkin
Given: 빈 캘린더 상태
When:
  1. 폼에 다음 정보 입력:
     - 제목: "무한 반복 일정"
     - 날짜: 2025-10-15
     - 반복: 체크됨
     - 반복 유형: 매일
     - 반복 간격: 1
     - 종료일: (비워둠)
  2. "일정 추가" 버튼 클릭
Then:
  1. API POST /api/events-list 호출 확인
  2. 기본 종료일(2025-12-30)까지 일정 생성
  3. 이벤트 목록에 종료일 표시 안 함

Locators:
- Repeat End Date: `page.locator('#repeat-end-date')`
```

---

### 시나리오 2: 반복 일정 조회 (Read Recurring)

#### TC2.1: 반복 일정 목록에서 반복 정보 표시
```gherkin
Given: 일일 반복 일정이 생성됨 (5개 인스턴스)
When: 캘린더 페이지 로드
Then:
  1. 이벤트 목록에 첫 번째 일정 표시
  2. 반복 정보 표시: "반복: 1일마다 (종료: 2025-10-20)"
  3. 반복 아이콘 함께 표시

Locators:
- Event List Item: `page.getByTestId('event-list').locator('div').first()`
- Repeat Info Text: `page.getByText(/반복: \d+일마다/)`
- Repeat Icon: `page.locator('svg[data-testid="RepeatIcon"]')`
```

#### TC2.2: 반복 일정 요약 정보 확인
```gherkin
Given: 격주 팀 미팅 (interval=2) 생성
When: 이벤트 목록에서 항목 확인
Then:
  1. 제목 표시
  2. 날짜 표시
  3. 시간 표시 (시작 - 종료)
  4. 카테고리 표시
  5. 반복 정보 표시: "반복: 2주마다 (종료: 2025-11-30)"

Locators:
- Event Title: `page.getByText('격주 팀 미팅')`
- Event Date: `page.getByText('2025-10-15')`
- Event Time: `page.getByText(/\d{2}:\d{2} - \d{2}:\d{2}/)`
- Event Category: `page.getByText(/카테고리:/)`
```

#### TC2.3: 반복 일정 시리즈에서 특정 인스턴스 확인
```gherkin
Given: 매일 반복 일정 생성됨 (5개 인스턴스, 모두 동일 repeatId)
When: 캘린더에서 각 인스턴스 확인
Then:
  1. 각 인스턴스가 별도 일정으로 표시됨
  2. 모든 인스턴스가 동일한 제목
  3. 모든 인스턴스가 동일한 시간
  4. 모든 인스턴스가 동일한 반복 정보
  5. 각 인스턴스마다 Edit/Delete 버튼 제공

Locators:
- Edit Button: `page.locator('button[aria-label="Edit event"]')`
- Delete Button: `page.locator('button[aria-label="Delete event"]')`
```

---

### 시나리오 3: 반복 일정 편집 (Update Recurring)

#### TC3.1: 단일 인스턴스 편집 (제목 변경)
```gherkin
Given: 매일 반복 일정이 생성됨 (5개, repeatId="repeat-1")
When:
  1. 두 번째 인스턴스(2025-10-16)의 Edit 버튼 클릭
  2. RecurringEventDialog 나타남
     - 제목: "반복 일정 수정"
     - 메시지: "해당 일정만 수정하시겠어요?"
  3. "예" 버튼 클릭
  4. 폼 로드됨 (이벤트 데이터 표시)
  5. 제목을 "매일 회의 - 취소"로 변경
  6. "일정 수정" 버튼 클릭
Then:
  1. API PUT /api/events/{eventId} 호출 확인
  2. 요청 본문에 다음 포함:
     - title: "매일 회의 - 취소"
     - repeat: { type: 'none', interval: 0 }
  3. 해당 일정만 업데이트됨
  4. 다른 4개 일정은 변경 없음
  5. 변경된 일정은 반복 정보 표시 안 함

Locators:
- Edit Button: `page.locator('button[aria-label="Edit event"]').nth(1)` (두 번째)
- Dialog Title: `page.getByRole('heading', { name: '반복 일정 수정' })`
- Dialog Single Button: `page.getByRole('button', { name: '예' })`
- Form Title Input: `page.locator('#title')`
```

#### TC3.2: 단일 인스턴스 편집 - 취소
```gherkin
Given: 매일 반복 일정 Edit 버튼 클릭 후 RecurringEventDialog 표시
When: "취소" 버튼 클릭
Then:
  1. Dialog 닫힘
  2. API 호출 없음
  3. 원본 데이터 유지

Locators:
- Dialog Cancel Button: `page.getByRole('button', { name: '취소' })`
```

#### TC3.3: 전체 시리즈 편집 (카테고리 변경)
```gherkin
Given: 매일 반복 일정이 생성됨 (5개, repeatId="repeat-1")
When:
  1. 세 번째 인스턴스(2025-10-17)의 Edit 버튼 클릭
  2. RecurringEventDialog 나타남
  3. "아니오" 버튼 클릭
  4. 폼 로드됨
  5. 카테고리를 "개인"으로 변경
  6. "일정 수정" 버튼 클릭
Then:
  1. API PUT /api/recurring-events/repeat-1 호출 확인
  2. 요청 본문에 다음 포함:
     - category: "개인"
  3. 모든 5개 일정의 카테고리가 "개인"으로 변경
  4. 모든 일정이 동일한 repeatId 유지
  5. 다른 필드는 변경 없음

Locators:
- Edit Button: `page.locator('button[aria-label="Edit event"]').nth(2)` (세 번째)
- Dialog Series Button: `page.getByRole('button', { name: '아니오' })`
- Category Select: `page.locator('#category')`
```

#### TC3.4: 전체 시리즈 편집 (설명 변경)
```gherkin
Given: 격주 팀 미팅 (4개 인스턴스) 생성됨
When:
  1. 첫 번째 인스턴스 Edit 클릭
  2. "아니오" (전체) 선택
  3. 설명을 "팀 회의 - 분기별 평가"로 변경
  4. "일정 수정" 클릭
Then:
  1. API PUT /api/recurring-events/{repeatId} 호출
  2. 요청 본문: { description: "팀 회의 - 분기별 평가" }
  3. 모든 4개 일정의 description 업데이트
  4. 다른 필드는 변경 없음

Locators:
- Description Input: `page.locator('#description')`
```

#### TC3.5: 전체 시리즈 편집 (반복 설정 변경)
```gherkin
Given: 일일 반복 일정 (5개) 생성됨
When:
  1. 첫 번째 인스턴스 Edit 클릭
  2. "아니오" (전체) 선택
  3. 반복 유형을 "매일" → "매주"로 변경
  4. 반복 간격을 "1" → "2"로 변경
  5. "일정 수정" 클릭
Then:
  1. API PUT /api/recurring-events/{repeatId} 호출
  2. 요청 본문:
     ```json
     {
       "repeat": {
         "type": "weekly",
         "interval": 2,
         "endDate": "2025-10-20"
       }
     }
     ```
  3. 모든 일정의 repeat 정보 업데이트
  4. 서버에서 실제 일정 날짜는 변경 안 함 (기존 생성된 인스턴스 유지)

Locators:
- Repeat Type Select: `page.locator('#repeat-type')`
- Repeat Interval Input: `page.locator('#repeat-interval')`
```

#### TC3.6: 단일 인스턴스 편집 후 "반복" 아이콘 사라짐
```gherkin
Given: 매일 반복 일정 (5개)
When: 한 개 일정을 "예" (단일)로 편집 후 제목 변경
Then:
  1. 해당 일정만 수정됨
  2. repeat: { type: 'none', interval: 0 }으로 설정
  3. 이벤트 목록에서 해당 일정의 반복 아이콘 사라짐
  4. 다른 4개 일정은 반복 아이콘 유지
  5. 나머지 일정들은 계속 "반복: 1일마다" 표시

Locators:
- Repeat Icon: `page.locator('svg[data-testid="RepeatIcon"]')`
```

---

### 시나리오 4: 반복 일정 삭제 (Delete Recurring)

#### TC4.1: 단일 인스턴스 삭제
```gherkin
Given: 매일 반복 일정 (5개, repeatId="repeat-1")
When:
  1. 두 번째 인스턴스(2025-10-16)의 Delete 버튼 클릭
  2. RecurringEventDialog 나타남
     - 제목: "반복 일정 삭제"
     - 메시지: "해당 일정만 삭제하시겠어요?"
  3. "예" 버튼 클릭
Then:
  1. API DELETE /api/events/{eventId} 호출 확인
  2. 해당 일정만 삭제됨
  3. 4개 일정 남음
  4. 남은 일정들은 repeatId 유지
  5. Snackbar: "일정이 삭제되었습니다" 표시

Locators:
- Delete Button: `page.locator('button[aria-label="Delete event"]').nth(1)` (두 번째)
- Dialog Title: `page.getByRole('heading', { name: '반복 일정 삭제' })`
- Dialog Single Delete Button: `page.getByRole('button', { name: '예' })`
- Snackbar Success: `page.getByText('일정이 삭제되었습니다')`
```

#### TC4.2: 전체 시리즈 삭제
```gherkin
Given: 매일 반복 일정 (5개, repeatId="repeat-1")
When:
  1. 세 번째 인스턴스(2025-10-17)의 Delete 버튼 클릭
  2. RecurringEventDialog 나타남
  3. "아니오" 버튼 클릭 (전체 삭제)
Then:
  1. API DELETE /api/recurring-events/repeat-1 호출 확인
  2. 모든 5개 일정 삭제됨
  3. 이벤트 목록 비워짐
  4. Snackbar: "일정이 삭제되었습니다" 표시

Locators:
- Delete Button: `page.locator('button[aria-label="Delete event"]').nth(2)` (세 번째)
- Dialog Series Delete Button: `page.getByRole('button', { name: '아니오' })`
```

#### TC4.3: 삭제 취소
```gherkin
Given: 매일 반복 일정 Delete 버튼 클릭 후 Dialog 표시
When: "취소" 버튼 클릭
Then:
  1. Dialog 닫힘
  2. API 호출 없음
  3. 모든 일정 유지

Locators:
- Dialog Cancel Button: `page.getByRole('button', { name: '취소' })`
```

#### TC4.4: 첫 번째 인스턴스 단일 삭제
```gherkin
Given: 일주일 반복 일정 (2025-10-15 시작)
When:
  1. 첫 번째 인스턴스(2025-10-15) Delete 클릭
  2. Dialog에서 "예" (단일 삭제) 선택
Then:
  1. 해당 일정만 삭제
  2. 2025-10-22 이후 일정들은 유지
  3. repeatId 유지

Locators:
- Delete Button First: `page.locator('button[aria-label="Delete event"]').first()`
```

#### TC4.5: 마지막 인스턴스 삭제 후 시리즈 완료
```gherkin
Given: 3개 일정이 남은 반복 시리즈
When: 마지막 인스턴스 Delete 클릭 후 "아니오" (전체) 선택
Then:
  1. API DELETE /api/recurring-events/{repeatId} 호출
  2. 모든 3개 일정 삭제됨
  3. 이벤트 목록 비워짐

Locators:
- Delete Last Event: `page.locator('button[aria-label="Delete event"]').last()`
```

---

### 시나리오 5: 반복 일정 드래그 앤 드롭 (Drag & Drop Recurring)

#### TC5.1: 단일 인스턴스 드래그
```gherkin
Given: 매일 반복 일정 (5개, 2025-10-15 ~ 2025-10-20)
When:
  1. 두 번째 인스턴스(2025-10-16)를 2025-10-25로 드래그
  2. RecurringEventDialog 나타남
  3. "예" 버튼 클릭 (단일 인스턴스만 이동)
Then:
  1. Dialog 닫힘
  2. API PUT /api/events/{eventId} 호출
  3. 요청 본문: { date: "2025-10-25", ... }
  4. 해당 일정만 새 날짜로 이동
  5. 다른 4개 일정은 원래 날짜 유지
  6. 이동된 일정은 repeat: { type: 'none' } 설정

Locators:
- Draggable Event: `page.locator('text=매일 반복').nth(1)` (두 번째)
- Calendar Drop Zone: `page.locator('[data-date="2025-10-25"]')` (구현에 따라 조정)
```

#### TC5.2: 전체 시리즈 드래그
```gherkin
Given: 매일 반복 일정 (5개, 2025-10-15 ~ 2025-10-20)
When:
  1. 첫 번째 인스턴스를 2025-10-20으로 드래그 (+5일)
  2. RecurringEventDialog 나타남
  3. "아니오" 버튼 클릭 (전체 시리즈 이동)
Then:
  1. API PUT /api/recurring-events/{repeatId} 호출
  2. 요청 본문:
     ```json
     {
       "date": "2025-10-20",
       "dateOffset": 5
     }
     ```
  3. 모든 5개 일정이 5일씩 앞으로 이동
  4. 새 날짜: 2025-10-20, 2025-10-21, 2025-10-22, 2025-10-23, 2025-10-24
  5. 모든 일정이 동일한 repeatId 유지
  6. repeat 정보 유지

Locators:
- Event to Drag: `page.locator('text=매일 회의').first()`
```

#### TC5.3: 드래그 후 오버랩 감지
```gherkin
Given:
  - 매일 반복 일정 A (2025-10-15 ~ 2025-10-20, 09:00-10:00)
  - 기존 일정 B (2025-10-22, 09:00-10:00)
When:
  1. 반복 일정 A의 첫 번째를 2025-10-22로 드래그
  2. Overlap Dialog 나타남
     - "다음 시간에 겹치는 일정이 있습니다"
     - 충돌 일정 B 표시
  3. "계속" 버튼 클릭
Then:
  1. Overlap Dialog 닫힘
  2. RecurringEventDialog (단일 vs 전체) 나타남
  3. 선택 후 진행

Locators:
- Overlap Dialog: `page.getByRole('dialog').filter({ has: page.getByText('겹치는 일정') })`
- Continue Button: `page.getByRole('button', { name: '계속' })`
```

#### TC5.4: 드래그 취소
```gherkin
Given: 반복 일정 드래그 중 RecurringEventDialog 표시
When: "취소" 버튼 클릭
Then:
  1. Dialog 닫힘
  2. 일정이 원래 위치로 복원
  3. API 호출 없음

Locators:
- Cancel Button: `page.getByRole('button', { name: '취소' })`
```

---

### 시나리오 6: 에러 케이스 (Error Cases)

#### TC6.1: 유효하지 않은 반복 간격
```gherkin
Given: 반복 일정 생성 폼 열음
When:
  1. 반복 간격에 "0" 입력
  2. "일정 추가" 클릭
Then:
  1. 에러 메시지: "반복 간격은 1 이상이어야 합니다"
  2. API 호출 안 됨
  3. 폼 유지

Locators:
- Repeat Interval Input: `page.locator('#repeat-interval')`
- Error Message: `page.getByText(/반복 간격은 1 이상/)`
```

#### TC6.2: 종료일이 시작일보다 이전
```gherkin
Given: 반복 일정 생성 폼 열음
When:
  1. 시작 날짜: 2025-10-20
  2. 종료 날짜: 2025-10-15
  3. "일정 추가" 클릭
Then:
  1. 에러 메시지: "종료 날짜는 시작 날짜 이후여야 합니다"
  2. API 호출 안 됨

Locators:
- Error Message: `page.getByText(/종료 날짜는/)`
```

#### TC6.3: 반복 시리즈를 찾을 수 없음
```gherkin
Given: 반복 시리즈 삭제됨 (모든 인스턴스 제거됨)
When: 같은 repeatId로 DELETE /api/recurring-events/{repeatId} 호출
Then:
  1. API 응답: 404 "Recurring series not found"
  2. 에러 처리: 사용자 친화적 메시지 표시

Locators:
- Error Dialog: `page.getByRole('dialog').filter({ has: page.getByText(/찾을 수 없/) })`
```

#### TC6.4: 네트워크 오류 시 재시도
```gherkin
Given: 반복 일정 편집 중 네트워크 끊김
When:
  1. PUT /api/recurring-events/{repeatId} 실패
  2. Snackbar: "네트워크 오류가 발생했습니다" 표시
Then:
  1. 사용자가 재시도할 수 있는 상태 유지
  2. 폼 데이터 유지

Locators:
- Snackbar Error: `page.getByText(/네트워크 오류/)`
```

---

### 시나리오 7: 반복 일정과 단일 일정 혼합 (Mixed Workflows)

#### TC7.1: 반복 일정 시리즈에서 단일 인스턴스 편집
```gherkin
Given: 매일 반복 일정 (5개)
When:
  1. 두 번째 인스턴스 Edit → "예" (단일) → 제목 변경
  2. 그 다음 세 번째 인스턴스 Edit → "아니오" (전체) → 카테고리 변경
Then:
  1. 두 번째 일정: repeat: { type: 'none' }, 새 제목, 기존 카테고리
  2. 첫 번째, 세 번째 ~ 다섯 번째: repeat: { type: 'daily' }, 기존 제목, 새 카테고리
  3. 세 번째는 실제로 별도의 repeatId 가져야 할까? → 원본 repeatId 유지, repeat 정보만 업데이트

Locators:
- Event Edit Buttons: `page.locator('button[aria-label="Edit event"]')`
```

#### TC7.2: 반복 일정 일부 삭제 후 나머지 편집
```gherkin
Given: 격주 미팅 (4개)
When:
  1. 첫 번째 Delete → "예" (단일) → 삭제됨
  2. 이제 3개 남음
  3. 새 첫 번째(원래 두 번째) Edit → "아니오" (전체) → 카테고리 변경
Then:
  1. API DELETE /api/events/{eventId1} 호출
  2. API PUT /api/recurring-events/{repeatId} 호출
  3. 남은 3개의 카테고리 변경됨
  4. 3개 모두 동일한 repeatId 유지

Locators:
- Delete First Event: `page.locator('button[aria-label="Delete event"]').first()`
```

#### TC7.3: 반복 일정 전체 삭제 후 새 일정 생성
```gherkin
Given: 매일 반복 일정 5개 존재
When:
  1. 하나의 인스턴스 Delete → "아니오" (전체) → 모두 삭제
  2. 새로운 반복 일정 생성
Then:
  1. API DELETE /api/recurring-events/{repeatId} 호출
  2. 5개 모두 삭제
  3. API POST /api/events-list 호출 (새 반복 일정)
  4. 새로운 repeatId 할당
  5. 이전 repeatId와 다름

Locators:
- Delete for Series: `page.locator('button[aria-label="Delete event"]').nth(1)`
```

---

## 테스트 데이터 초기화 전략

### Test Data Isolation
```typescript
// beforeEach에서 실행:
1. page.clock.install({ time: new Date('2025-10-01T00:00:00Z') })
   - 브라우저 시간 고정 (2025-10-01)

2. initializeTestData(page)
   - GET /api/events로 현재 모든 이벤트 조회
   - 각 eventId를 DELETE /api/events/{id}로 개별 삭제
   - e2e.json 파일이 빈 배열 상태로 시작
```

### Test Data Setup Functions
```typescript
// createTestRecurringEvent(page, eventData)
// - API POST /api/events-list로 반복 일정 생성
// - 생성된 반복 일정의 첫 번째 인스턴스 반환

// createMultipleTestEvents(page, eventDataArray)
// - 여러 개의 일정을 순차적으로 생성
// - 반복 일정과 단일 일정 혼합 가능
```

---

## 테스트 실행 환경

### Environment Variables
```bash
TEST_ENV=e2e  # e2e.json 데이터베이스 사용
```

### Configuration
- **Test Directory**: `src/__tests__/e2e/`
- **Browser**: Chromium (Playwright default)
- **Timeout per Test**: 30 seconds
- **Workers**: 1 (Sequential execution for data isolation)
- **Server Setup**: `TEST_ENV=e2e pnpm dev`
  - Backend: http://localhost:3000
  - Frontend: http://localhost:5173

### npm Scripts
```bash
pnpm test:e2e              # Run all E2E tests
pnpm test:e2e:ui          # Run with Playwright UI
pnpm test:e2e:report      # View HTML report
```

---

## 추가 검증 항목

### UI Element Visibility
- [ ] 반복 체크박스 표시/숨김 (새 일정 생성 시에만 표시)
- [ ] 반복 유형 선택지 활성화/비활성화
- [ ] 반복 간격 입력 필드 유효성
- [ ] 반복 종료일 입력 필드 유효성
- [ ] Dialog 버튼 활성화 상태

### API Request/Response Validation
- [ ] POST /api/events-list: 요청 본문 구조
- [ ] PUT /api/recurring-events/{repeatId}: 요청 본문 구조
- [ ] DELETE /api/recurring-events/{repeatId}: 요청 구조
- [ ] 응답 상태 코드: 200/201/204/404
- [ ] 응답 데이터 유형

### State Management
- [ ] 폼 입력 상태 유지/초기화
- [ ] Dialog 상태 열기/닫기
- [ ] 선택된 이벤트 상태
- [ ] 에러 상태 표시/해제

### Data Consistency
- [ ] repeatId는 시리즈의 모든 이벤트에서 동일
- [ ] 단일 편집 후 repeat: { type: 'none' }
- [ ] 시리즈 편집 후 반복 정보 유지
- [ ] 드래그 후 dateOffset 정확성

