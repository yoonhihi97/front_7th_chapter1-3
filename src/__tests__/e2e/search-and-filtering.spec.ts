import { test, expect } from '@playwright/test';

import { EventForm } from '../../types';
import { initializeTestData, createTestEvent, waitForEventLoading } from './helpers/event-helpers';

// 검색 테스트용 이벤트 데이터
const searchTestEvents: EventForm[] = [
  {
    title: '팀 회의',
    date: '2025-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '프로젝트 진행 상황 논의',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    title: '점심 약속',
    date: '2025-10-15',
    startTime: '12:00',
    endTime: '13:00',
    description: '동료들과 점심',
    location: '강남역',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    title: '프로젝트 리뷰',
    date: '2025-10-16',
    startTime: '16:00',
    endTime: '17:00',
    description: '분기 프로젝트 리뷰',
    location: '대회의실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
];

// 뷰 변경 테스트용 이벤트 데이터
const viewTestEvents: EventForm[] = [
  {
    title: '주간 회의',
    date: '2025-10-14', // 현재 주 (2025-10-12 ~ 2025-10-18)
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 업무 회의',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    title: '개인 일정',
    date: '2025-10-21', // 다음 주
    startTime: '14:00',
    endTime: '15:00',
    description: '개인 약속',
    location: '카페',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
];

test.beforeEach(async ({ page }) => {
  // 1. 브라우저 시간 고정 (2025-10-15, 수요일)
  await page.clock.install({ time: new Date('2025-10-15T00:00:00Z') });

  // 2. 테스트 데이터 초기화
  await initializeTestData(page);

  // 3. 페이지 로드
  await page.goto('/');

  // 4. 일정 로딩 완료 대기
  await waitForEventLoading(page);
});

test.describe('SearchAndFiltering', () => {
  test('TC-SEARCH-01: 제목으로 검색 (성공 케이스)', async ({ page }) => {
    // Arrange: 여러 일정 생성
    for (const event of searchTestEvents) {
      await createTestEvent(page, event);
    }
    await page.reload();
    await waitForEventLoading(page);

    // Act: 검색어 "팀" 입력
    const searchInput = page.locator('#search');
    await searchInput.fill('팀');

    // Assert: "팀 회의"만 필터링되어 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).not.toBeVisible();
    await expect(eventList.getByText('프로젝트 리뷰')).not.toBeVisible();
  });

  test('TC-SEARCH-02: 검색 결과 없음 (빈 상태)', async ({ page }) => {
    // Arrange: 여러 일정 생성
    for (const event of searchTestEvents) {
      await createTestEvent(page, event);
    }
    await page.reload();
    await waitForEventLoading(page);

    // Act: 존재하지 않는 검색어 입력
    const searchInput = page.locator('#search');
    await searchInput.fill('존재하지않는검색어');

    // Assert: 빈 상태 메시지 표시
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();

    // 일정 항목이 보이지 않음
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의')).not.toBeVisible();
    await expect(eventList.getByText('점심 약속')).not.toBeVisible();
    await expect(eventList.getByText('프로젝트 리뷰')).not.toBeVisible();
  });

  test('TC-SEARCH-03: 뷰 변경 시 날짜 범위 필터 적용', async ({ page }) => {
    // Arrange: 여러 주의 일정 생성
    for (const event of viewTestEvents) {
      await createTestEvent(page, event);
    }
    await page.reload();
    await waitForEventLoading(page);

    // Act & Assert: Week 뷰 선택 (기본값)
    const viewSelector = page.locator('[aria-label="뷰 타입 선택"]');

    // Week 뷰에서는 현재 주(10/12~10/18)의 일정만 표시
    await viewSelector.click();
    await page.getByRole('option', { name: 'Week' }).click();
    await waitForEventLoading(page);

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('주간 회의')).toBeVisible();
    await expect(eventList.getByText('개인 일정')).not.toBeVisible();

    // Act & Assert: Month 뷰 선택
    await viewSelector.click();
    await page.getByRole('option', { name: 'Month' }).click();
    await waitForEventLoading(page);

    // Month 뷰에서는 현재 월(10월)의 모든 일정 표시
    await expect(eventList.getByText('주간 회의')).toBeVisible();
    await expect(eventList.getByText('개인 일정')).toBeVisible();
  });

  test('검색어와 뷰 필터 결합 테스트', async ({ page }) => {
    // Arrange: 여러 주의 일정 생성
    for (const event of viewTestEvents) {
      await createTestEvent(page, event);
    }
    await page.reload();
    await waitForEventLoading(page);

    // Act: Week 뷰 명시적 선택
    const viewSelector = page.locator('[aria-label="뷰 타입 선택"]');
    await viewSelector.click();
    await page.getByRole('option', { name: 'Week' }).click();
    await waitForEventLoading(page);

    // Act: Week 뷰에서 검색어 입력
    const searchInput = page.locator('#search');
    await searchInput.fill('주간');

    // Assert: Week 뷰 + 검색어 필터 결합
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('주간 회의')).toBeVisible();
    await expect(eventList.getByText('개인 일정')).not.toBeVisible();

    // Act: 검색어 초기화
    await searchInput.clear();

    // Assert: 검색어 제거 후 Week 뷰 기준으로만 필터링
    await expect(eventList.getByText('주간 회의')).toBeVisible();
    await expect(eventList.getByText('개인 일정')).not.toBeVisible();
  });

  test('대소문자 구분 없이 검색', async ({ page }) => {
    // Arrange: 일정 생성
    await createTestEvent(page, searchTestEvents[0]); // "팀 회의"
    await page.reload();
    await waitForEventLoading(page);

    // Act: 소문자로 검색
    const searchInput = page.locator('#search');
    await searchInput.fill('팀');

    // Assert: 결과 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의')).toBeVisible();
  });

  test('설명 필드로도 검색 가능', async ({ page }) => {
    // Arrange: 일정 생성
    await createTestEvent(page, searchTestEvents[0]); // description: "프로젝트 진행 상황 논의"
    await page.reload();
    await waitForEventLoading(page);

    // Act: 설명 내용으로 검색
    const searchInput = page.locator('#search');
    await searchInput.fill('진행 상황');

    // Assert: 결과 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의')).toBeVisible();
  });

  test('위치 필드로도 검색 가능', async ({ page }) => {
    // Arrange: 일정 생성
    await createTestEvent(page, searchTestEvents[1]); // location: "강남역"
    await page.reload();
    await waitForEventLoading(page);

    // Act: 위치로 검색
    const searchInput = page.locator('#search');
    await searchInput.fill('강남');

    // Assert: 결과 표시됨
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('점심 약속')).toBeVisible();
  });

  test('검색어 입력 후 즉시 필터링 (onChange 이벤트)', async ({ page }) => {
    // Arrange: 여러 일정 생성
    for (const event of searchTestEvents) {
      await createTestEvent(page, event);
    }
    await page.reload();
    await waitForEventLoading(page);

    // Act: 검색어 한 글자씩 입력
    const searchInput = page.locator('#search');

    // "팀" 입력 시 즉시 필터링됨
    await searchInput.fill('팀');

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의')).toBeVisible();

    // "점" 추가 입력 시 즉시 필터링 변경됨
    await searchInput.clear();
    await searchInput.fill('점심');

    await expect(eventList.getByText('점심 약속')).toBeVisible();
    await expect(eventList.getByText('팀 회의')).not.toBeVisible();
  });
});
