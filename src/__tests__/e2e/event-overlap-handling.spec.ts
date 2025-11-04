import { test, expect } from '@playwright/test';

import { EventForm } from '../../types';
import {
  initializeTestData,
  createTestEvent,
  getEventEditButton,
  waitForEventLoading,
} from './helpers/event-helpers';

// ============================================================================
// EventOverlapHandling - 일정 겹침 처리
// ============================================================================

test.describe('EventOverlapHandling', () => {
  test.beforeEach(async ({ page }) => {
    // 브라우저 시간 고정
    await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });

    // 데이터 초기화
    await initializeTestData(page);

    // 페이지 로드
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ==========================================================================
  // 시나리오 1: 일정 생성 시 겹침 감지
  // ==========================================================================

  test.describe('시나리오 1: 일정 생성 시 겹침 감지', () => {
    test('TC1.1: 겹침 감지 - 다이얼로그 표시', async ({ page }) => {
      // Arrange: 기존 일정 생성 (14:00-16:00)
      const existingEvent: EventForm = {
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '16:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };
      await createTestEvent(page, existingEvent);
      await page.reload();
      await waitForEventLoading(page);

      // Act: 겹치는 새 일정 입력 (14:30-15:30)
      await page.locator('#title').fill('새 미팅');
      await page.locator('#date').fill('2025-10-15');
      await page.locator('#start-time').fill('14:30');
      await page.locator('#end-time').fill('15:30');
      await page.getByTestId('event-submit-button').click();

      // Assert: 겹침 다이얼로그 표시 확인
      await expect(page.getByText('일정 겹침 경고')).toBeVisible();
      await expect(page.getByText('다음 일정과 겹칩니다:')).toBeVisible();
      await expect(page.getByText(/기존 회의.*2025-10-15.*14:00-16:00/)).toBeVisible();

      // 버튼 표시 확인
      await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
      await expect(page.getByRole('button', { name: '계속 진행' })).toBeVisible();
    });

    test('TC1.2: 경계값 - 겹치지 않음 (14:00-16:00 vs 16:00-18:00)', async ({ page }) => {
      // Arrange: 기존 일정 생성
      const existingEvent: EventForm = {
        title: '오후 회의',
        date: '2025-10-16',
        startTime: '14:00',
        endTime: '16:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };
      await createTestEvent(page, existingEvent);
      await page.reload();
      await waitForEventLoading(page);

      // Act: 경계값: 정확히 16:00 시작
      await page.locator('#title').fill('저녁 회의');
      await page.locator('#date').fill('2025-10-16');
      await page.locator('#start-time').fill('16:00');
      await page.locator('#end-time').fill('18:00');
      await page.getByTestId('event-submit-button').click();

      // Assert: 겹침 다이얼로그가 표시되지 않음
      await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

      // 일정이 정상 생성됨
      await expect(page.getByTestId('event-list').getByText('저녁 회의')).toBeVisible();
    });

    test('TC1.3: 경계값 - 겹치지 않음 (14:00-16:00 vs 12:00-14:00)', async ({ page }) => {
      // Arrange: 기존 일정 생성
      const existingEvent: EventForm = {
        title: '점심 회의',
        date: '2025-10-17',
        startTime: '14:00',
        endTime: '16:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };
      await createTestEvent(page, existingEvent);
      await page.reload();
      await waitForEventLoading(page);

      // Act: 경계값: 정확히 14:00 종료
      await page.locator('#title').fill('오전 회의');
      await page.locator('#date').fill('2025-10-17');
      await page.locator('#start-time').fill('12:00');
      await page.locator('#end-time').fill('14:00');
      await page.getByTestId('event-submit-button').click();

      // Assert: 겹침 다이얼로그가 표시되지 않음
      await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

      // 일정이 정상 생성됨
      await expect(page.getByTestId('event-list').getByText('오전 회의')).toBeVisible();
    });
  });

  // ==========================================================================
  // 시나리오 2: 겹침 다이얼로그 처리
  // ==========================================================================

  test.describe('시나리오 2: 겹침 다이얼로그 처리', () => {
    test('TC2.1: 다이얼로그 취소 - 일정 미생성', async ({ page }) => {
      // Arrange: 기존 일정 생성
      const existingEvent: EventForm = {
        title: '기존 일정',
        date: '2025-10-18',
        startTime: '10:00',
        endTime: '12:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };
      await createTestEvent(page, existingEvent);
      await page.reload();
      await waitForEventLoading(page);

      // Act: 겹치는 새 일정 입력
      await page.locator('#title').fill('취소할 일정');
      await page.locator('#date').fill('2025-10-18');
      await page.locator('#start-time').fill('11:00');
      await page.locator('#end-time').fill('13:00');
      await page.getByTestId('event-submit-button').click();

      // 겹침 다이얼로그에서 취소 클릭
      await expect(page.getByText('일정 겹침 경고')).toBeVisible();
      await page.getByRole('button', { name: '취소' }).click();

      // Assert: 다이얼로그 닫힘
      await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

      // 새 일정이 생성되지 않음
      const eventList = page.getByTestId('event-list');
      await expect(eventList.getByText('취소할 일정')).not.toBeVisible();

      // 기존 일정은 유지
      await expect(eventList.getByText('기존 일정')).toBeVisible();

      // 폼이 유지됨 (사용자가 다시 수정 가능)
      await expect(page.locator('#title')).toHaveValue('취소할 일정');
    });

    test('TC2.2: 다이얼로그 계속 진행 - 일정 생성', async ({ page }) => {
      // Arrange: 기존 일정 생성
      const existingEvent: EventForm = {
        title: '기존 일정',
        date: '2025-10-19',
        startTime: '10:00',
        endTime: '12:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };
      await createTestEvent(page, existingEvent);
      await page.reload();
      await waitForEventLoading(page);

      // Act: 겹치는 새 일정 입력
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

      // Assert: 다이얼로그 닫힘
      await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

      // 새 일정이 생성됨
      const eventList = page.getByTestId('event-list');
      await expect(eventList.getByText('생성할 일정')).toBeVisible();
      await expect(eventList.getByText('11:00 - 13:00')).toBeVisible();

      // 기존 일정도 유지
      await expect(eventList.getByText('기존 일정')).toBeVisible();
    });
  });

  // ==========================================================================
  // 시나리오 3: 일정 수정 시 겹침 감지
  // ==========================================================================

  test.describe('시나리오 3: 일정 수정 시 겹침 감지', () => {
    test('TC4.1: 수정 폼에서 겹침 감지', async ({ page }) => {
      // Arrange: 2개 일정 생성
      const editableEvent: EventForm = {
        title: '수정할 일정',
        date: '2025-10-22',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };

      const conflictEvent: EventForm = {
        title: '충돌 대상',
        date: '2025-10-22',
        startTime: '11:00',
        endTime: '12:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };

      await createTestEvent(page, editableEvent);
      await createTestEvent(page, conflictEvent);

      await page.reload();
      await waitForEventLoading(page);

      // Act: 수정 버튼 클릭
      const editButton = getEventEditButton(page, 0);
      await editButton.click();

      // 폼에 기존 데이터가 로드되었는지 확인
      await expect(page.locator('#title')).toHaveValue('수정할 일정');

      // 시간을 변경하여 '충돌 대상'과 겹치도록 수정
      await page.locator('#start-time').clear();
      await page.locator('#start-time').fill('10:30');
      await page.locator('#end-time').clear();
      await page.locator('#end-time').fill('11:30');

      // 제출 버튼 클릭
      await page.getByTestId('event-submit-button').click();

      // Assert: 겹침 다이얼로그 표시
      await expect(page.getByText('일정 겹침 경고')).toBeVisible();
      await expect(page.getByText(/충돌 대상.*2025-10-22.*11:00-12:00/)).toBeVisible();

      // 취소 시 원래 시간 유지
      await page.getByRole('button', { name: '취소' }).click();
      const eventList = page.getByTestId('event-list');
      await expect(eventList.getByText('09:00 - 10:00')).toBeVisible();
    });
  });
});
