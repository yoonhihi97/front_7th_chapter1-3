import { test, expect } from '@playwright/test';

import {
  basicEvent,
  minimalEvent,
  existingEvent,
  lunchEvent,
  overlappingEvent,
  conflictingEvent,
  multipleEvents,
  categoryEvent,
} from './fixtures/test-events';
import {
  initializeTestData,
  createTestEvent,
  fillEventForm,
  clearEventForm,
  verifyEventInList,
  getEventEditButton,
  getEventDeleteButton,
  submitEventAndWait,
  getEventCount,
  verifyErrorMessage,
  verifyFormValues,
  verifyEmptyState,
  waitForEventLoading,
} from './helpers/event-helpers';

test.beforeEach(async ({ page }) => {
  // 1. 브라우저 시간 고정 (2025-10-01)
  await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });

  // 2. 테스트 데이터 초기화 (e2e.json 빈 배열로)
  await initializeTestData(page);

  // 3. 페이지 로드
  await page.goto('/');

  // 4. 일정 로딩 완료 대기
  await waitForEventLoading(page);
});

// ============================================================================
// 시나리오 1: 일정 생성 (Create)
// ============================================================================

test.describe('시나리오 1: 일정 생성 (Create)', () => {
  test('TC1.1: 정상적인 일정 생성', async ({ page }) => {
    // Arrange: 데이터 준비는 beforeEach에서 완료

    // Act: 폼 입력 및 제출
    await fillEventForm(page, basicEvent);
    await submitEventAndWait(page);

    // Assert: 일정이 목록에 표시되는지 확인
    await verifyEventInList(page, basicEvent);

    // 폼이 초기화되었는지 확인
    await expect(page.locator('#title')).toHaveValue('');
    await expect(page.locator('#date')).toHaveValue('');
  });

  test('TC1.2: 필수 필드 검증 - 제목 누락', async ({ page }) => {
    // Act: 제목 없이 다른 필드만 입력
    await fillEventForm(page, {
      date: basicEvent.date,
      startTime: basicEvent.startTime,
      endTime: basicEvent.endTime,
    });
    await page.getByTestId('event-submit-button').click();

    // Assert: 에러 메시지 표시
    await verifyErrorMessage(page, '필수 정보를 모두 입력해주세요.');

    // 일정이 추가되지 않았는지 확인
    const count = await getEventCount(page);
    expect(count).toBe(0);
  });

  test('TC1.3: 시간 검증 - 종료 시간이 시작 시간보다 빠름', async ({ page }) => {
    // Act: 종료 시간을 시작 시간보다 빠르게 설정
    await fillEventForm(page, {
      title: '잘못된 시간 일정',
      date: basicEvent.date,
      startTime: '15:00',
      endTime: '14:00', // 시작: 15:00, 종료: 14:00 (빠름)
    });
    await page.getByTestId('event-submit-button').click();

    // Assert: 시간 에러 메시지 표시
    await verifyErrorMessage(page, '시간 설정을 확인해주세요.');

    // 일정이 추가되지 않았는지 확인
    const count = await getEventCount(page);
    expect(count).toBe(0);
  });

  test('TC1.4: 필수 필드 검증 - 날짜 누락', async ({ page }) => {
    // Act: 날짜 없이 제출
    await fillEventForm(page, {
      title: '날짜 없는 일정',
      startTime: basicEvent.startTime,
      endTime: basicEvent.endTime,
    });
    await page.getByTestId('event-submit-button').click();

    // Assert: 에러 메시지 표시
    await verifyErrorMessage(page, '필수 정보를 모두 입력해주세요.');
  });

  test('TC1.5: 최소 필드로 일정 생성 (제목, 날짜, 시간만)', async ({ page }) => {
    // Act: 최소 필드만 입력
    await fillEventForm(page, minimalEvent);
    await submitEventAndWait(page);

    // Assert: 일정이 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText(minimalEvent.title)).toBeVisible();
    await expect(eventList.getByText(minimalEvent.date)).toBeVisible();
    await expect(
      eventList.getByText(`${minimalEvent.startTime} - ${minimalEvent.endTime}`)
    ).toBeVisible();
  });
});

// ============================================================================
// 시나리오 2: 일정 조회 (Read)
// ============================================================================

test.describe('시나리오 2: 일정 조회 (Read)', () => {
  test('TC2.1: 일정 목록에서 생성된 일정 확인', async ({ page }) => {
    // Arrange: 테스트 일정 생성
    await createTestEvent(page, lunchEvent);

    // 페이지 새로고침하여 일정 로드
    await page.reload();
    await waitForEventLoading(page);

    // Assert: 일정이 목록에 표시되는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText(lunchEvent.title)).toBeVisible();
    await expect(eventList.getByText(lunchEvent.date)).toBeVisible();
    await expect(
      eventList.getByText(`${lunchEvent.startTime} - ${lunchEvent.endTime}`)
    ).toBeVisible();
    await expect(eventList.getByText(lunchEvent.description)).toBeVisible();
    await expect(eventList.getByText(lunchEvent.location)).toBeVisible();
    await expect(eventList.getByText(`카테고리: ${lunchEvent.category}`)).toBeVisible();
  });

  test('TC2.2: 여러 일정 조회 (다중 일정 표시)', async ({ page }) => {
    // Arrange: 여러 일정 생성
    for (const event of multipleEvents) {
      await createTestEvent(page, event);
    }

    // 페이지 새로고침
    await page.reload();
    await waitForEventLoading(page);

    // Assert: 모든 일정이 표시되는지 확인
    for (const event of multipleEvents) {
      await expect(page.getByTestId('event-list').getByText(event.title)).toBeVisible();
    }

    // 일정 개수 확인
    const count = await getEventCount(page);
    expect(count).toBe(multipleEvents.length);
  });

  test('TC2.3: 일정이 없을 때 빈 상태 확인', async ({ page }) => {
    // Assert: 빈 상태 메시지 표시
    await verifyEmptyState(page);
  });
});

// ============================================================================
// 시나리오 3: 일정 수정 (Update)
// ============================================================================

test.describe('시나리오 3: 일정 수정 (Update)', () => {
  test('TC3.1: 제목만 수정', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await createTestEvent(page, existingEvent);
    await page.reload();
    await waitForEventLoading(page);

    // Act: 수정 버튼 클릭
    await getEventEditButton(page, 0).click();

    // 폼에 기존 데이터가 로드되었는지 확인
    await verifyFormValues(page, existingEvent);

    // 제목 수정
    await clearEventForm(page);
    await fillEventForm(page, {
      ...existingEvent,
      title: '수정된 회의',
    });
    await submitEventAndWait(page);

    // Assert: 변경사항 반영 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('수정된 회의')).toBeVisible();
    await expect(eventList.getByText('기존 회의')).not.toBeVisible();

    // 다른 필드는 유지
    await expect(eventList.getByText(existingEvent.date)).toBeVisible();
    await expect(
      eventList.getByText(`${existingEvent.startTime} - ${existingEvent.endTime}`)
    ).toBeVisible();
  });

  test('TC3.2: 여러 필드 동시 수정', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await createTestEvent(page, existingEvent);
    await page.reload();
    await waitForEventLoading(page);

    // Act: 수정 시작
    await getEventEditButton(page, 0).click();

    // 여러 필드 수정
    await clearEventForm(page);
    await fillEventForm(page, {
      title: '완전히 새로운 회의',
      date: '2025-10-25',
      startTime: '10:00',
      endTime: '11:00',
      description: '변경된 설명',
    });
    await submitEventAndWait(page);

    // Assert: 모든 변경사항 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('완전히 새로운 회의')).toBeVisible();
    await expect(eventList.getByText('2025-10-25')).toBeVisible();
    await expect(eventList.getByText('10:00 - 11:00')).toBeVisible();
    await expect(eventList.getByText('변경된 설명')).toBeVisible();
  });

  test('TC3.3: 수정 중 필수 필드 검증 (제목 삭제 시도)', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await createTestEvent(page, existingEvent);
    await page.reload();
    await waitForEventLoading(page);

    // Act: 수정 시작 후 제목 삭제
    await getEventEditButton(page, 0).click();
    await page.locator('#title').clear();
    await page.getByTestId('event-submit-button').click();

    // Assert: 에러 메시지 표시
    await verifyErrorMessage(page, '필수 정보를 모두 입력해주세요.');

    // 기존 일정이 변경되지 않았는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText(existingEvent.title)).toBeVisible();
  });

  test('TC3.4: 수정 중 시간 검증', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await createTestEvent(page, existingEvent);
    await page.reload();
    await waitForEventLoading(page);

    // Act: 수정 시작 후 종료 시간 변경 (시작 시간보다 이르게)
    await getEventEditButton(page, 0).click();
    await page.locator('#end-time').clear();
    await page.locator('#end-time').fill('08:00'); // startTime은 09:00
    await page.getByTestId('event-submit-button').click();

    // Assert: 시간 에러 메시지 표시
    await verifyErrorMessage(page, '시간 설정을 확인해주세요.');
  });
});

// ============================================================================
// 시나리오 4: 일정 삭제 (Delete)
// ============================================================================

test.describe('시나리오 4: 일정 삭제 (Delete)', () => {
  test('TC4.1: 일정 삭제 확인', async ({ page }) => {
    // Arrange: 삭제할 일정 생성
    await createTestEvent(page, existingEvent);
    await page.reload();
    await waitForEventLoading(page);

    // Act: 삭제 버튼 클릭
    await getEventDeleteButton(page, 0).click();
    await waitForEventLoading(page);

    // Assert: 일정이 목록에서 제거되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText(existingEvent.title)).not.toBeVisible();

    // 빈 상태 메시지 표시
    await verifyEmptyState(page);
  });

  test('TC4.2: 여러 일정 중 하나만 삭제', async ({ page }) => {
    // Arrange: 여러 일정 생성
    for (const event of multipleEvents) {
      await createTestEvent(page, event);
    }
    await page.reload();
    await waitForEventLoading(page);

    // Act: 두 번째 일정 삭제
    await getEventDeleteButton(page, 1).click();
    await waitForEventLoading(page);

    // Assert: 첫 번째와 세 번째는 유지, 두 번째는 삭제
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('일정 1')).toBeVisible();
    await expect(eventList.getByText('일정 2')).not.toBeVisible();
    await expect(eventList.getByText('일정 3')).toBeVisible();

    // 일정 개수 확인
    const count = await getEventCount(page);
    expect(count).toBe(multipleEvents.length - 1);
  });
});

// ============================================================================
// 에러 케이스 테스트
// ============================================================================

test.describe('에러 케이스 테스트', () => {
  test('EC1: 일정 겹침 경고 (취소)', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await createTestEvent(page, overlappingEvent);
    await page.reload();
    await waitForEventLoading(page);

    // Act: 겹치는 일정 생성 시도
    await fillEventForm(page, conflictingEvent);
    await page.getByTestId('event-submit-button').click();

    // Assert: 겹침 경고 다이얼로그 표시
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    await expect(page.getByText(/다음 일정과 겹칩니다/)).toBeVisible();

    // 취소 버튼 클릭
    await page.getByRole('button', { name: '취소' }).click();

    // 겹치는 일정이 생성되지 않았는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText(conflictingEvent.title)).not.toBeVisible();
  });

  test('EC2: 일정 겹침 경고 (계속 진행)', async ({ page }) => {
    // Arrange: 기존 일정 생성
    await createTestEvent(page, overlappingEvent);
    await page.reload();
    await waitForEventLoading(page);

    // Act: 겹치는 일정 생성 시도
    await fillEventForm(page, conflictingEvent);
    await page.getByTestId('event-submit-button').click();

    // 겹침 경고에서 계속 진행
    await page.getByRole('button', { name: '계속 진행' }).click();
    await waitForEventLoading(page);

    // Assert: 일정이 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText(conflictingEvent.title)).toBeVisible();
  });

  test('EC3: 카테고리 선택 검증', async ({ page }) => {
    // Act: 특정 카테고리로 일정 생성
    await fillEventForm(page, categoryEvent);
    await submitEventAndWait(page);

    // Assert: 카테고리가 정확하게 저장되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText(`카테고리: ${categoryEvent.category}`)).toBeVisible();
  });
});
