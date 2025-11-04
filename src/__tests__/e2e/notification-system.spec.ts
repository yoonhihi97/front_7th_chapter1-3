import { test, expect } from '@playwright/test';

import { EventForm } from '../../types';
import { initializeTestData, createTestEvent, waitForEventLoading } from './helpers/event-helpers';

test.beforeEach(async ({ page }) => {
  // 1. 테스트 데이터 초기화 (e2e.json 빈 배열로)
  await initializeTestData(page);
});

// ============================================================================
// TC-NTF-01: 알림 시간 도래 시 메시지 표시
// ============================================================================

test.describe('NotificationSystem', () => {
  test('TC-NTF-01: 알림 시간 도래 시 메시지 표시', async ({ page }) => {
    // Arrange: 일정 생성 (notificationTime: 10, 시작: 14:00)
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

    await createTestEvent(page, notificationEvent);

    // 시간 고정 (2025-10-15 13:50:00) - goto 전에 설치
    await page.clock.install({ time: new Date('2025-10-15T13:50:00') });
    await page.goto('/');
    await waitForEventLoading(page);

    // Act: 1초 진행 (알림 체크 interval 트리거)
    await page.clock.runFor(1000);

    // Assert: Alert가 표시되고 올바른 메시지 확인
    const expectedMessage = '10분 후 팀 회의 일정이 시작됩니다.';
    await expect(page.getByText(expectedMessage)).toBeVisible();
  });

  // ============================================================================
  // TC-NTF-02: 알림 범위 밖에서는 표시 안 됨
  // ============================================================================

  test('TC-NTF-02: 알림 범위 밖에서는 표시 안 됨', async ({ page }) => {
    // Arrange: 일정 생성 (notificationTime: 10, 시작: 14:00)
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

    await createTestEvent(page, notificationEvent);

    // 시간 고정 (2025-10-15 13:00:00) - goto 전에 설치
    await page.clock.install({ time: new Date('2025-10-15T13:00:00') });
    await page.goto('/');
    await waitForEventLoading(page);

    // Act: 1초 진행 (알림 체크 interval 트리거)
    await page.clock.runFor(1000);

    // Assert: Alert가 표시되지 않음 (60분 남아 있음, 알림은 10분 이내에만)
    const expectedMessage = '10분 후 팀 회의 일정이 시작됩니다.';
    await expect(page.getByText(expectedMessage)).not.toBeVisible();
  });

  // ============================================================================
  // TC-NTF-03: 여러 일정의 알림이 독립적으로 표시됨
  // ============================================================================

  test('TC-NTF-03: 여러 일정의 알림이 독립적으로 표시됨', async ({ page }) => {
    // Arrange: 첫 번째 일정 생성 (notificationTime: 10, 시작: 13:55)
    const firstEvent: EventForm = {
      title: '회의 1',
      date: '2025-10-15',
      startTime: '13:55',
      endTime: '14:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    // 두 번째 일정 생성 (notificationTime: 5, 시작: 14:00)
    const secondEvent: EventForm = {
      title: '회의 2',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '14:30',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 5,
    };

    await createTestEvent(page, firstEvent);
    await createTestEvent(page, secondEvent);

    // 시간 고정 (2025-10-15 13:45:00) - goto 전에 설치
    await page.clock.install({ time: new Date('2025-10-15T13:45:00') });
    await page.goto('/');
    await waitForEventLoading(page);

    // Act: 1초 진행 (13:45에서 첫 번째 알림만 표시되어야 함)
    await page.clock.runFor(1000);

    // Assert: 첫 번째 알림만 표시 (13:55 - 13:45 = 10분 남음)
    const firstMessage = '10분 후 회의 1 일정이 시작됩니다.';
    await expect(page.getByText(firstMessage)).toBeVisible();

    // 두 번째 알림은 아직 표시 안 됨 (14:00 - 13:45 = 15분 남음, notificationTime은 5분)
    const secondMessage = '5분 후 회의 2 일정이 시작됩니다.';
    await expect(page.getByText(secondMessage)).not.toBeVisible();

    // Act: 시간을 13:55로 설정
    await page.clock.setSystemTime(new Date('2025-10-15T13:55:00'));
    await page.clock.runFor(1000);

    // Assert: 두 번째 알림 추가 표시 (14:00 - 13:55 = 5분 남음)
    await expect(page.getByText(secondMessage)).toBeVisible();

    // 첫 번째 알림도 여전히 표시되어야 함
    await expect(page.getByText(firstMessage)).toBeVisible();
  });
});
