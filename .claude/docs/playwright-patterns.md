# Playwright 패턴 가이드

Playwright E2E 테스트 작성 시 올바른 패턴과 금지된 패턴을 정리한 가이드입니다.

## ✅ 올바른 사용 방법

### 1. Locator 선택 (우선순위 순)

```typescript
// 1순위: getByRole (의미론적으로 정확함)
const button = page.getByRole('button', { name: '일정 추가' });
const select = page.getByRole('combobox', { name: '반복 유형' });
const option = page.getByRole('option', { name: '매일' });

// 2순위: getByTestId (테스트 전용 속성)
const submitBtn = page.getByTestId('event-submit-button');

// 3순위: getByText (텍스트 기반)
const link = page.getByText('일정 조회');

// 4순위: locator (CSS/XPath)
const titleInput = page.locator('#title');
const dateInput = page.locator('input[type="date"]');

// ❌ 절대 금지
page.getByLabelText('제목')  // Playwright Page API에 없음 (Testing Library API)
```

### 2. 폼 입력 작성

```typescript
// ✅ 올바름
await page.locator('#title').fill('일정 제목');
await page.locator('#date').fill('2025-10-15');
await page.getByRole('combobox', { name: '카테고리' }).click();
await page.getByRole('option', { name: '업무' }).click();

// ❌ 틀림
await page.type('#title', '일정 제목')  // deprecated
await page.fill('#title', '일정 제목')  // fill() 없음
```

### 3. 버튼/링크 클릭

```typescript
// ✅ 올바름
await page.getByRole('button', { name: '일정 추가' }).click();
await page.getByTestId('event-submit-button').click();

// ❌ 틀림
await page.click('button:has-text("일정 추가")')  // 복잡함
await page.click('#submit-button')  // ID 없을 수 있음
```

### 4. API 응답 대기

```typescript
// ✅ 올바름
await page.waitForResponse(
  (response) =>
    response.url().includes('/api/events') &&
    response.status() === 201
);

// 또는 Promise.all 사용
const [response] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('/api/events')),
  page.getByRole('button', { name: '일정 추가' }).click(),
]);

// ❌ 틀림
await page.waitForTimeout(2000)  // NEVER
await new Promise(r => setTimeout(r, 2000))  // NEVER
```

### 5. 요소 가시성 확인

```typescript
// ✅ 올바름 (자동으로 대기함)
await expect(page.getByText('일정이 생성되었습니다')).toBeVisible();
await expect(page.getByTestId('event-list')).toContainText('일정 제목');

// ❌ 틀림
const isVisible = await page.isVisible('#element')  // 즉시 반환
```

### 6. 텍스트 검증

```typescript
// ✅ 올바름
await expect(page.getByTestId('event-list')).toContainText('반복: 1일마다');
await expect(page.locator('#title')).toHaveValue('일정 제목');
await expect(page.getByText('반복 일정')).toBeVisible();

// ❌ 틀림
const text = await page.textContent('.event-item')  // null일 수 있음
```

### 7. 네트워크 대기

```typescript
// ✅ 올바름
await page.waitForLoadState('networkidle');  // 모든 네트워크 완료

// 또는 특정 API 호출 대기
const apiPromise = page.waitForResponse(
  (r) => r.url().includes('/api/events') && r.status() === 200
);
await page.getByRole('button', { name: '일정 수정' }).click();
await apiPromise;

// ❌ 틀림
await page.waitForLoadState('load')  // 너무 빠를 수 있음
```

### 8. 여러 요소 선택

```typescript
// ✅ 올바름
const buttons = page.locator('button[aria-label="Edit event"]');
const count = await buttons.count();  // 요소 개수
const secondButton = buttons.nth(1);  // 두 번째 요소
await secondButton.click();

// ❌ 틀림
const buttons = await page.$$('button[aria-label="Edit event"]')  // deprecated
```

---

## ❌ 절대 금지 패턴 (Anti-Patterns)

**타임아웃:**
- ❌ `await page.waitForTimeout(1000)` - NEVER
- ❌ `setTimeout(async () => {...}, 1000)` - NEVER
- ✅ 대신 `expect().toBeVisible()` 또는 `waitForResponse()` 사용

**변수명:**
- ❌ `const 제목 = ...` - 한글 변수명 금지
- ✅ `const title = ...` - 영어 사용

**로케이터:**
- ❌ Hypothetical locators - 실제로 존재하지 않는 로케이터
- ✅ 테스트 설계 문서의 로케이터 표에서만 사용

**Deprecated API:**
- ❌ `page.type()` - Use `fill()` or `press()` instead
- ❌ `page.$()` or `page.$$()` - Use `locator()` instead
- ❌ `page.isVisible()` without assertion - Returns immediately

**잘못된 API:**
- ❌ `getByLabelText()` - Not in Playwright Page API (Testing Library API)
- ❌ `page.fill()` 직접 호출 - `locator().fill()` 사용
- ❌ Hard-coded waits before assertions

---

## 참고자료

- [Playwright Official Docs](https://playwright.dev)
- [Locator API](https://playwright.dev/docs/locators)
- [Auto-waiting](https://playwright.dev/docs/actionability)
- [Assertions](https://playwright.dev/docs/test-assertions)
