import { test, expect } from '@playwright/test';

import type { Event } from '../../types';
import { initializeTestData, getEventCount, waitForEventLoading } from './helpers/event-helpers';

// ============================================================================
// 시나리오 1: 반복 일정 생성 (Create Recurring)
// ============================================================================

test.describe('시나리오 1: 반복 일정 생성 (Create Recurring)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });
    await initializeTestData(page);
    await page.goto('/');
    await waitForEventLoading(page);
  });

  test('TC1.1: 일일 반복 일정 생성', async ({ page }) => {
    // Arrange
    const eventData = {
      title: '매일 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'daily' as const,
        interval: 1,
        endDate: '2025-10-20',
      },
      notificationTime: 10,
    };

    // Act: API로 생성
    const response = await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          { ...eventData, date: '2025-10-15' },
          { ...eventData, date: '2025-10-16' },
          { ...eventData, date: '2025-10-17' },
          { ...eventData, date: '2025-10-18' },
          { ...eventData, date: '2025-10-19' },
          { ...eventData, date: '2025-10-20' },
        ],
      },
    });

    // Assert
    expect(response.status()).toBe(201);
    const createdEvents = (await response.json()) as Event[];
    expect(createdEvents).toHaveLength(6);
    expect(createdEvents[0].repeat.type).toBe('daily');

    // 모두 같은 repeatId 공유
    const repeatId = createdEvents[0].repeat.id;
    createdEvents.forEach((event) => {
      expect(event.repeat.id).toBe(repeatId);
    });
  });

  test('TC1.2: 주간 반복 일정 생성', async ({ page }) => {
    const eventData = {
      title: '격주 팀 미팅',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'weekly' as const,
        interval: 2,
        endDate: '2025-11-30',
      },
      notificationTime: 10,
    };

    const response = await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          { ...eventData, date: '2025-10-15' },
          { ...eventData, date: '2025-10-29' },
          { ...eventData, date: '2025-11-12' },
          { ...eventData, date: '2025-11-26' },
        ],
      },
    });

    expect(response.status()).toBe(201);
    const createdEvents = (await response.json()) as Event[];
    expect(createdEvents[0].repeat.type).toBe('weekly');
  });

  test('TC1.3: 월간 반복 일정 생성', async ({ page }) => {
    const eventData = {
      title: '월간 결산',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'monthly' as const,
        interval: 1,
        endDate: '2025-12-31',
      },
      notificationTime: 10,
    };

    const response = await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          { ...eventData, date: '2025-10-15' },
          { ...eventData, date: '2025-11-15' },
          { ...eventData, date: '2025-12-15' },
        ],
      },
    });

    expect(response.status()).toBe(201);
    const createdEvents = (await response.json()) as Event[];
    expect(createdEvents).toHaveLength(3);
  });
});

// ============================================================================
// 시나리오 2: 반복 일정 조회 (Read Recurring)
// ============================================================================

test.describe('시나리오 2: 반복 일정 조회 (Read Recurring)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });
    await initializeTestData(page);

    // API로 반복 일정 생성
    await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          {
            title: '테스트 일정',
            date: '2025-10-15',
            startTime: '09:00',
            endTime: '10:00',
            description: '',
            location: '',
            category: '',
            repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
            notificationTime: 10,
          },
          {
            title: '테스트 일정',
            date: '2025-10-16',
            startTime: '09:00',
            endTime: '10:00',
            description: '',
            location: '',
            category: '',
            repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
            notificationTime: 10,
          },
          {
            title: '테스트 일정',
            date: '2025-10-17',
            startTime: '09:00',
            endTime: '10:00',
            description: '',
            location: '',
            category: '',
            repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
            notificationTime: 10,
          },
        ],
      },
    });

    await page.goto('/');
    await waitForEventLoading(page);
  });

  test('TC2.1: 반복 일정이 일정 목록에 표시됨', async ({ page }) => {
    // Assert: 일정이 표시되고 반복 아이콘이 있는지 확인
    const count = await getEventCount(page);
    expect(count).toBeGreaterThan(0);

    // 반복 아이콘 확인
    const repeatIcon = page.locator('svg[data-testid="RepeatIcon"]').first();
    await expect(repeatIcon).toBeVisible();
  });

  test('TC2.2: 반복 일정의 반복 정보가 표시됨', async ({ page }) => {
    // "1일마다" 같은 반복 정보 텍스트 확인
    const repeatInfo = page.locator('text=/일마다|주마다|개월마다|년마다/').first();
    await expect(repeatInfo).toBeVisible();
  });
});

// ============================================================================
// 시나리오 3: 반복 일정 편집 (Update Recurring)
// ============================================================================

test.describe('시나리오 3: 반복 일정 편집 (Update Recurring)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });
    await initializeTestData(page);

    // 반복 일정 생성
    await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          {
            title: '편집 테스트',
            date: '2025-10-15',
            startTime: '09:00',
            endTime: '10:00',
            description: '',
            location: '',
            category: '',
            repeat: { type: 'daily', interval: 1, endDate: '2025-10-17' },
            notificationTime: 10,
          },
          {
            title: '편집 테스트',
            date: '2025-10-16',
            startTime: '09:00',
            endTime: '10:00',
            description: '',
            location: '',
            category: '',
            repeat: { type: 'daily', interval: 1, endDate: '2025-10-17' },
            notificationTime: 10,
          },
          {
            title: '편집 테스트',
            date: '2025-10-17',
            startTime: '09:00',
            endTime: '10:00',
            description: '',
            location: '',
            category: '',
            repeat: { type: 'daily', interval: 1, endDate: '2025-10-17' },
            notificationTime: 10,
          },
        ],
      },
    });

    await page.goto('/');
    await waitForEventLoading(page);
  });

  test('TC3.1: 단일 인스턴스 편집 - 다이얼로그 나타남', async ({ page }) => {
    // Act: 두 번째 이벤트 편집
    await page.locator('button[aria-label="Edit event"]').nth(1).click();

    // Assert: RecurringEventDialog 확인
    await expect(page.getByRole('heading', { name: '반복 일정 수정' })).toBeVisible();
    await expect(page.getByText('해당 일정만 수정하시겠어요?')).toBeVisible();
  });

  test('TC3.2: 전체 시리즈 편집 - 다이얼로그 나타남', async ({ page }) => {
    // Act: 첫 번째 이벤트 편집
    await page.locator('button[aria-label="Edit event"]').nth(0).click();

    // Assert: RecurringEventDialog 확인
    await expect(page.getByRole('heading', { name: '반복 일정 수정' })).toBeVisible();

    // 취소 클릭
    await page.getByRole('button', { name: '취소' }).click();
  });
});

// ============================================================================
// 시나리오 4: 반복 일정 삭제 (Delete Recurring)
// ============================================================================

test.describe('시나리오 1: 반복 일정 삭제 (Delete Recurring)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });
    await initializeTestData(page);
    await page.goto('/');
    await waitForEventLoading(page);
  });

  test('TC2.1: 단일 인스턴스 삭제', async ({ page }) => {
    // Arrange: 반복 일정 생성
    const eventData = {
      title: '삭제 테스트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'daily' as const,
        interval: 1,
        endDate: '2025-10-17',
      },
      notificationTime: 10,
    };

    const createResponse = await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          { ...eventData, date: '2025-10-15' },
          { ...eventData, date: '2025-10-16' },
          { ...eventData, date: '2025-10-17' },
        ],
      },
    });

    const createdEvents = (await createResponse.json()) as Event[];
    const secondEventId = createdEvents[1].id;

    await page.reload();
    await waitForEventLoading(page);

    // Act: 두 번째 이벤트 삭제
    await page.locator('button[aria-label="Delete event"]').nth(1).click();

    // RecurringEventDialog 확인
    await expect(page.getByRole('heading', { name: '반복 일정 삭제' })).toBeVisible();

    // "예" 버튼 클릭 (단일만 삭제)
    await page.getByRole('button', { name: '예' }).click();
    await page.waitForLoadState('networkidle');

    // Assert: API로 직접 확인 - 해당 이벤트가 삭제됐는지 확인
    const getResponse = await page.request.get(`http://localhost:3000/api/events`);
    const allEvents = (await getResponse.json()) as { events: Event[] };
    const deletedEventExists = allEvents.events.some((e) => e.id === secondEventId);

    expect(deletedEventExists).toBe(false); // 삭제된 이벤트는 없어야 함
  });

  test('TC2.2: 전체 시리즈 삭제', async ({ page }) => {
    // Arrange
    const eventData = {
      title: '시리즈 삭제',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'daily' as const,
        interval: 1,
        endDate: '2025-10-17',
      },
      notificationTime: 10,
    };

    const createResponse = await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          { ...eventData, date: '2025-10-15' },
          { ...eventData, date: '2025-10-16' },
          { ...eventData, date: '2025-10-17' },
        ],
      },
    });

    const createdEvents = (await createResponse.json()) as Event[];
    const repeatId = createdEvents[0].repeat.id;

    await page.reload();
    await waitForEventLoading(page);

    // Act: 첫 번째 이벤트 삭제
    await page.locator('button[aria-label="Delete event"]').nth(0).click();

    // RecurringEventDialog 확인
    await expect(page.getByRole('heading', { name: '반복 일정 삭제' })).toBeVisible();

    // "아니오" 버튼 클릭 (전체 삭제)
    await page.getByRole('button', { name: '아니오' }).click();
    await page.waitForLoadState('networkidle');

    // Assert: API로 직접 확인 - 같은 repeatId 이벤트가 모두 삭제됐는지 확인
    const getResponse = await page.request.get(`http://localhost:3000/api/events`);
    const allEvents = (await getResponse.json()) as { events: Event[] };
    const seriesStillExists = allEvents.events.some((e) => e.repeat.id === repeatId);

    expect(seriesStillExists).toBe(false); // 시리즈의 모든 이벤트가 삭제되어야 함
  });

  test('TC2.3: 삭제 취소', async ({ page }) => {
    // Arrange
    const eventData = {
      title: '취소 테스트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'daily' as const,
        interval: 1,
        endDate: '2025-10-17',
      },
      notificationTime: 10,
    };

    await page.request.post('http://localhost:3000/api/events-list', {
      data: {
        events: [
          { ...eventData, date: '2025-10-15' },
          { ...eventData, date: '2025-10-16' },
          { ...eventData, date: '2025-10-17' },
        ],
      },
    });

    await page.reload();
    await waitForEventLoading(page);

    const initialCount = await getEventCount(page);

    // Act: 삭제 시작
    await page.locator('button[aria-label="Delete event"]').nth(0).click();

    await expect(page.getByRole('heading', { name: '반복 일정 삭제' })).toBeVisible();

    // "취소" 클릭
    await page.getByRole('button', { name: '취소' }).click();
    await page.waitForLoadState('networkidle');

    // Assert: 개수 변화 없음
    const finalCount = await getEventCount(page);
    expect(finalCount).toBe(initialCount);
  });
});

// ============================================================================
// 시나리오 3: 에러 케이스 (Error Cases)
// ============================================================================

test.describe('시나리오 2: 에러 케이스 (Error Cases)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2025-10-01T00:00:00Z') });
    await initializeTestData(page);
    await page.goto('/');
    await waitForEventLoading(page);
  });

  test('TC3.1: 필수 필드 누락 시 에러', async ({ page }) => {
    // Act: 제목 없이 제출
    await page.locator('#date').fill('2025-10-15');
    await page.locator('#start-time').fill('09:00');
    await page.locator('#end-time').fill('10:00');

    await page.getByTestId('event-submit-button').click();

    // Assert: 에러 메시지 표시
    await expect(page.getByText('필수 정보를 모두 입력해주세요.')).toBeVisible();
  });

  test('TC3.2: 시간 검증 에러 - 종료시간이 시작시간보다 이름', async ({ page }) => {
    // Act: 잘못된 시간으로 입력
    await page.locator('#title').fill('시간 에러 테스트');
    await page.locator('#date').fill('2025-10-15');
    await page.locator('#start-time').fill('15:00');
    await page.locator('#end-time').fill('14:00'); // 시작보다 이름

    await page.getByTestId('event-submit-button').click();

    // Assert: 시간 에러 메시지
    await expect(page.getByText('시간 설정을 확인해주세요.')).toBeVisible();
  });
});
