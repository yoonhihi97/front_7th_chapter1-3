import { Page, expect, Locator } from '@playwright/test';

import { EventForm, Event } from '../../../types';

const API_BASE_URL = 'http://localhost:3000';

/**
 * e2e.json 파일을 빈 배열로 초기화
 * 모든 이벤트를 조회한 후 삭제
 */
export async function initializeTestData(page: Page) {
  try {
    // 먼저 모든 이벤트를 가져옴
    const response = await page.request.get(`${API_BASE_URL}/api/events`);
    const data = (await response.json()) as { events: Event[] };
    const eventIds = data.events.map((event) => event.id);

    // 모든 이벤트를 개별적으로 삭제
    for (const eventId of eventIds) {
      await page.request.delete(`${API_BASE_URL}/api/events/${eventId}`);
    }
  } catch (error) {
    console.warn('Failed to initialize test data:', error);
  }
}

/**
 * API를 통해 테스트 이벤트 생성
 * @returns 생성된 Event 객체 (id 포함)
 */
export async function createTestEvent(page: Page, eventData: EventForm): Promise<Event> {
  const response = await page.request.post(`${API_BASE_URL}/api/events`, {
    data: eventData,
  });

  expect(response.status()).toBe(201);
  const createdEvent = (await response.json()) as Event;
  return createdEvent;
}

/**
 * 폼에 이벤트 데이터 입력
 * Material-UI TextField와 Select를 위한 올바른 로케이터 사용
 */
export async function fillEventForm(page: Page, eventData: Partial<EventForm>) {
  // 제목 입력
  if (eventData.title !== undefined) {
    await page.locator('#title').fill(eventData.title);
  }

  // 날짜 입력
  if (eventData.date !== undefined) {
    await page.locator('#date').fill(eventData.date);
  }

  // 시작 시간 입력
  if (eventData.startTime !== undefined) {
    await page.locator('#start-time').fill(eventData.startTime);
  }

  // 종료 시간 입력
  if (eventData.endTime !== undefined) {
    await page.locator('#end-time').fill(eventData.endTime);
  }

  // 설명 입력
  if (eventData.description !== undefined) {
    await page.locator('#description').fill(eventData.description);
  }

  // 위치 입력
  if (eventData.location !== undefined) {
    await page.locator('#location').fill(eventData.location);
  }

  // 카테고리 선택 (Material-UI Select)
  if (eventData.category !== undefined && eventData.category !== '') {
    // Select를 열기
    await page.locator('#category').click();
    // MenuItem의 aria-label로 옵션 선택
    await page.getByRole('option', { name: `${eventData.category}-option` }).click();
  }
}

/**
 * 폼 초기화 (모든 필드를 빈 값으로)
 */
export async function clearEventForm(page: Page) {
  await page.locator('#title').clear();
  await page.locator('#date').clear();
  await page.locator('#start-time').clear();
  await page.locator('#end-time').clear();
  await page.locator('#description').clear();
  await page.locator('#location').clear();
}

/**
 * 일정 목록에서 이벤트 정보 검증
 */
export async function verifyEventInList(page: Page, eventData: Partial<EventForm>) {
  const eventList = page.getByTestId('event-list');

  if (eventData.title) {
    await expect(eventList.getByText(eventData.title)).toBeVisible();
  }

  if (eventData.date) {
    await expect(eventList.getByText(eventData.date)).toBeVisible();
  }

  if (eventData.startTime && eventData.endTime) {
    await expect(
      eventList.getByText(`${eventData.startTime} - ${eventData.endTime}`)
    ).toBeVisible();
  }

  if (eventData.description) {
    await expect(eventList.getByText(eventData.description)).toBeVisible();
  }

  if (eventData.location) {
    await expect(eventList.getByText(eventData.location)).toBeVisible();
  }

  if (eventData.category) {
    await expect(eventList.getByText(`카테고리: ${eventData.category}`)).toBeVisible();
  }
}

/**
 * 특정 이벤트의 수정 버튼 찾기
 * 여러 이벤트가 있을 때는 nth() 인덱스로 선택
 */
export function getEventEditButton(page: Page, index: number = 0): Locator {
  return page.locator('button[aria-label="Edit event"]').nth(index);
}

/**
 * 특정 이벤트의 삭제 버튼 찾기
 * 여러 이벤트가 있을 때는 nth() 인덱스로 선택
 */
export function getEventDeleteButton(page: Page, index: number = 0): Locator {
  return page.locator('button[aria-label="Delete event"]').nth(index);
}

/**
 * 일정 로딩 완료 대기
 */
export async function waitForEventLoading(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * 일정 제출 버튼 클릭 후 API 응답 대기
 */
export async function submitEventAndWait(page: Page) {
  const submitButton = page.getByTestId('event-submit-button');

  // API 응답 대기를 위한 Promise 설정
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/events') &&
      (response.status() === 201 || response.status() === 200)
  );

  await submitButton.click();
  await responsePromise;
  await page.waitForLoadState('networkidle');
}

/**
 * 일정 목록에서 특정 제목의 일정이 존재하는지 확인
 */
export async function isEventInList(page: Page, title: string): Promise<boolean> {
  const eventList = page.getByTestId('event-list');
  const count = await eventList.getByText(title).count();
  return count > 0;
}

/**
 * 일정 목록의 총 개수 확인
 */
export async function getEventCount(page: Page): Promise<number> {
  // Edit event 버튼의 개수로 일정 개수 확인
  return await page.locator('button[aria-label="Edit event"]').count();
}

/**
 * 에러 메시지가 표시되는지 확인
 */
export async function verifyErrorMessage(page: Page, message: string) {
  await expect(page.getByText(message)).toBeVisible();
}

/**
 * 폼 필드 값 확인
 */
export async function verifyFormValues(page: Page, eventData: Partial<EventForm>) {
  if (eventData.title !== undefined) {
    await expect(page.locator('#title')).toHaveValue(eventData.title);
  }

  if (eventData.date !== undefined) {
    await expect(page.locator('#date')).toHaveValue(eventData.date);
  }

  if (eventData.startTime !== undefined) {
    await expect(page.locator('#start-time')).toHaveValue(eventData.startTime);
  }

  if (eventData.endTime !== undefined) {
    await expect(page.locator('#end-time')).toHaveValue(eventData.endTime);
  }

  if (eventData.description !== undefined) {
    await expect(page.locator('#description')).toHaveValue(eventData.description);
  }

  if (eventData.location !== undefined) {
    await expect(page.locator('#location')).toHaveValue(eventData.location);
  }
}

/**
 * 빈 상태 메시지 확인
 */
export async function verifyEmptyState(page: Page) {
  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('검색 결과가 없습니다.')).toBeVisible();
}
