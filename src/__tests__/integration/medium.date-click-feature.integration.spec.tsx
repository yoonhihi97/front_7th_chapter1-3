import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';

import { setupMockHandlerUpdating } from '../../__mocks__/handlersUtils';
import App from '../../App';
import { Event } from '../../types';

const theme = createTheme();

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

/**
 * 테스트 데이터 정의
 *
 * 시스템 시간: 2025-10-01 (setupTests.ts에서 고정)
 * - 2025-10-15: 기본 테스트 날짜 (월간 뷰에 표시됨)
 * - 2025-11-05: 다음 달 날짜 (월간 뷰에 표시됨)
 */

// 편집 테스트용 일반 일정
const singleEvent: Event = {
  id: 'test-event-1',
  title: '기존 일정',
  date: '2025-10-15',
  startTime: '10:00',
  endTime: '11:00',
  description: '편집 모드 테스트용',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

// 날짜 변경 테스트용 일정
const editableEvent: Event = {
  id: 'test-event-2',
  title: '이동할 일정',
  date: '2025-10-10',
  startTime: '09:00',
  endTime: '10:00',
  description: '날짜 변경 테스트용',
  location: '회의실 B',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

// 반복 일정 - 첫째 날
const recurringEvent1: Event = {
  id: 'recurring-1',
  title: '매일 회의',
  date: '2025-10-20',
  startTime: '14:00',
  endTime: '15:00',
  description: '반복 일정',
  location: '회의실 C',
  category: '업무',
  repeat: {
    type: 'daily',
    interval: 1,
    endDate: '2025-10-22',
    id: 'repeat-id-1',
  },
  notificationTime: 0,
};

// 반복 일정 - 둘째 날
const recurringEvent2: Event = {
  id: 'recurring-2',
  title: '매일 회의',
  date: '2025-10-21',
  startTime: '14:00',
  endTime: '15:00',
  description: '반복 일정',
  location: '회의실 C',
  category: '업무',
  repeat: {
    type: 'daily',
    interval: 1,
    endDate: '2025-10-22',
    id: 'repeat-id-1',
  },
  notificationTime: 0,
};

// 반복 일정 - 셋째 날
const recurringEvent3: Event = {
  id: 'recurring-3',
  title: '매일 회의',
  date: '2025-10-22',
  startTime: '14:00',
  endTime: '15:00',
  description: '반복 일정',
  location: '회의실 C',
  category: '업무',
  repeat: {
    type: 'daily',
    interval: 1,
    endDate: '2025-10-22',
    id: 'repeat-id-1',
  },
  notificationTime: 0,
};

describe('날짜 셀 클릭 기능 Integration 테스트', () => {
  describe('월간 뷰 날짜 클릭', () => {
    it('IT-1: 월간 뷰에서 날짜 셀을 클릭하면 날짜 필드에 해당 날짜가 자동 입력된다', async () => {
      // Given: 월간 뷰가 표시된 캘린더 (빈 이벤트)
      setupMockHandlerUpdating([]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 2025-10-15 날짜 셀을 클릭
      const monthView = screen.getByTestId('month-view');
      const targetDateCell = monthView.querySelector('[data-date="2025-10-15"]');
      expect(targetDateCell).toBeTruthy();

      await user.click(targetDateCell!);

      // Then: 날짜 필드에 "2025-10-15"가 입력되어야 함
      const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
      expect(dateInput.value).toBe('2025-10-15');
    });

    it('IT-4: 월간 뷰에서 다른 날짜(25일)를 클릭하면 해당 날짜가 자동 입력된다', async () => {
      // Given: 2025년 10월 캘린더
      setupMockHandlerUpdating([]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 25일 셀 클릭 (다른 주)
      const monthView = screen.getByTestId('month-view');
      const targetCell = monthView.querySelector('[data-date="2025-10-25"]');
      expect(targetCell).toBeTruthy();

      await user.click(targetCell!);

      // Then: 날짜 필드에 "2025-10-25"가 입력되어야 함
      const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
      expect(dateInput.value).toBe('2025-10-25');
    });

    it('IT-6: 반복 일정이 있는 날짜를 클릭하면 날짜가 입력된다', async () => {
      // Given: 반복 일정이 있는 캘린더
      setupMockHandlerUpdating([recurringEvent1, recurringEvent2, recurringEvent3]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 반복 일정이 있는 날짜 셀(2025-10-20) 클릭
      const monthView = screen.getByTestId('month-view');
      const targetDateCell = monthView.querySelector('[data-date="2025-10-20"]');
      expect(targetDateCell).toBeTruthy();

      await user.click(targetDateCell!);

      // Then: 날짜 필드에 "2025-10-20"이 입력되어야 함
      const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
      expect(dateInput.value).toBe('2025-10-20');
    });
  });

  describe('월간 뷰 추가 테스트', () => {
    it('IT-2: 월간 뷰에서 다른 날짜 셀을 클릭하면 날짜 필드에 해당 날짜가 자동 입력된다', async () => {
      // Given: 월간 뷰가 표시된 캘린더
      setupMockHandlerUpdating([]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 다른 날짜 셀(2025-10-08) 클릭
      const monthView = screen.getByTestId('month-view');
      const targetDateCell = monthView.querySelector('[data-date="2025-10-08"]');
      expect(targetDateCell).toBeTruthy();

      await user.click(targetDateCell!);

      // Then: 날짜 필드에 "2025-10-08"이 입력되어야 함
      const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
      expect(dateInput.value).toBe('2025-10-08');
    });
  });

  describe('편집 모드', () => {
    it('IT-3: 이벤트를 Edit로 편집 모드 진입하면 날짜 필드는 원래 값을 유지한다', async () => {
      // Given: 2025-10-15에 일정이 있는 캘린더
      setupMockHandlerUpdating([singleEvent]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: Edit 버튼을 클릭하여 편집 모드 진입
      const editButtons = await screen.findAllByLabelText('Edit event');
      await user.click(editButtons[0]);

      // Then: 날짜 필드가 원래 일정의 날짜를 유지해야 함
      const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
      expect(dateInput.value).toBe('2025-10-15');

      // 추가 검증: 편집 모드인지 확인 (제목이 입력되어 있음)
      const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
      expect(titleInput.value).toBe('기존 일정');
    });

    it('IT-5: 편집 모드에서 다른 날짜를 클릭하면 날짜 필드만 변경되고 다른 필드는 유지된다', async () => {
      // Given: 2025-10-10에 일정이 있고 편집 모드로 진입
      setupMockHandlerUpdating([editableEvent]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // Edit 버튼 클릭하여 편집 모드 진입
      const editButtons = await screen.findAllByLabelText('Edit event');
      await user.click(editButtons[0]);

      // 편집 모드 확인
      const dateInputBefore = screen.getByLabelText('날짜') as HTMLInputElement;
      expect(dateInputBefore.value).toBe('2025-10-10');

      const titleBefore = (screen.getByLabelText('제목') as HTMLInputElement).value;
      const startTimeBefore = (screen.getByLabelText('시작 시간') as HTMLInputElement).value;
      const endTimeBefore = (screen.getByLabelText('종료 시간') as HTMLInputElement).value;

      // When: 다른 날짜(2025-10-25) 셀 클릭
      const monthView = screen.getByTestId('month-view');
      const newDateCell = monthView.querySelector('[data-date="2025-10-25"]');
      expect(newDateCell).toBeTruthy();

      await user.click(newDateCell!);

      // Then: 날짜 필드가 "2025-10-25"로 변경되어야 함
      const dateInputAfter = screen.getByLabelText('날짜') as HTMLInputElement;
      expect(dateInputAfter.value).toBe('2025-10-25');

      // 추가 검증: 다른 필드는 그대로 유지되어야 함
      const titleAfter = (screen.getByLabelText('제목') as HTMLInputElement).value;
      const startTimeAfter = (screen.getByLabelText('시작 시간') as HTMLInputElement).value;
      const endTimeAfter = (screen.getByLabelText('종료 시간') as HTMLInputElement).value;

      expect(titleAfter).toBe(titleBefore);
      expect(titleAfter).toBe('이동할 일정');

      expect(startTimeAfter).toBe(startTimeBefore);
      expect(startTimeAfter).toBe('09:00');

      expect(endTimeAfter).toBe(endTimeBefore);
      expect(endTimeAfter).toBe('10:00');
    });
  });
});
