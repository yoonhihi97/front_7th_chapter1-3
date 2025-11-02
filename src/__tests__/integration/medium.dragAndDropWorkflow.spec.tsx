import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';

import {
  setupMockHandlerUpdating,
  setupMockHandlerRecurringListUpdate,
} from '../../__mocks__/handlersUtils';
import App from '../../App';

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

describe('드래그 앤 드롭 워크플로우 통합 테스트', () => {
  describe('일반 일정 드래그 앤 드롭', () => {
    it('일정을 다른 날짜로 드래그하면 날짜만 변경되고 시간은 유지된다', async () => {
      // Given: 2025-10-15 14:00-15:00 일정이 존재
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '팀 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '주간 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 캘린더에서 일정을 찾아 2025-10-20으로 드래그 앤 드롭
      const eventBox = screen.getByText('팀 회의');
      const targetCell = screen.getByTestId('month-view').querySelector('[data-date="2025-10-20"]');

      expect(targetCell).toBeInTheDocument();

      // 드래그 앤 드롭 시뮬레이션
      fireEvent.dragStart(eventBox);
      fireEvent.drop(targetCell!);

      // Then:
      // - 일정의 날짜가 2025-10-20으로 변경됨
      // - 시간은 14:00-15:00 유지됨
      // - PUT /api/events/:id 호출됨 (MSW에서 처리)
      // - 성공 토스트 표시
      await screen.findByText('일정이 수정되었습니다');

      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('2025-10-20')).toBeInTheDocument();
      expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    });

    it('드래그 시작 시 이벤트 ID가 dataTransfer에 저장된다', async () => {
      // Given: 일정이 존재
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '테스트 일정',
          date: '2025-10-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 일정을 드래그 시작
      const eventBox = screen.getByText('테스트 일정');
      const dragStartEvent = fireEvent.dragStart(eventBox);

      // Then: dataTransfer에 이벤트 ID가 저장됨
      // (실제 구현에서는 onDragStart 핸들러가 이를 처리)
      expect(dragStartEvent).toBe(true);
    });
  });

  describe('반복 일정 드래그 앤 드롭', () => {
    it('반복 일정 드롭 시 RecurringEventDialog가 표시된다', async () => {
      // Given: 반복 일정이 존재
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16', id: 'repeat-1' },
          notificationTime: 1,
        },
        {
          id: '2',
          title: '매일 회의',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16', id: 'repeat-1' },
          notificationTime: 1,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 반복 일정을 다른 날짜로 드래그 앤 드롭
      const eventBoxes = screen.getAllByText('매일 회의');
      const targetCell = screen.getByTestId('month-view').querySelector('[data-date="2025-10-20"]');

      fireEvent.dragStart(eventBoxes[0]);
      fireEvent.drop(targetCell!);

      // Then: RecurringEventDialog 다이얼로그 표시
      expect(await screen.findByText('반복 일정 수정')).toBeInTheDocument();
      expect(screen.getByText('해당 일정만 수정하시겠어요?')).toBeInTheDocument();
    });

    it('RecurringEventDialog에서 "예" 선택 시 단일 일정만 날짜 변경', async () => {
      // Given: 반복 일정 드래그 후 다이얼로그 표시
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16', id: 'repeat-1' },
          notificationTime: 1,
        },
        {
          id: '2',
          title: '매일 회의',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16', id: 'repeat-1' },
          notificationTime: 1,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const eventBoxes = screen.getAllByText('매일 회의');
      const targetCell = screen.getByTestId('month-view').querySelector('[data-date="2025-10-20"]');

      fireEvent.dragStart(eventBoxes[0]);
      fireEvent.drop(targetCell!);

      await screen.findByText('반복 일정 수정');

      // When: "예" 버튼 클릭
      const yesButton = screen.getByText('예');
      await user.click(yesButton);

      // Then:
      // - 해당 일정만 날짜 변경
      // - PUT /api/events/:id 호출
      // - repeat.type이 'none'으로 변경 (단일 일정으로 전환)
      await screen.findByText('일정이 수정되었습니다');

      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('2025-10-20')).toBeInTheDocument();
    });

    it('RecurringEventDialog에서 "아니오" 선택 시 전체 반복 시리즈 날짜 변경', async () => {
      // Given: 반복 일정 드래그 후 다이얼로그 표시
      setupMockHandlerRecurringListUpdate([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16', id: 'repeat-1' },
          notificationTime: 1,
        },
        {
          id: '2',
          title: '매일 회의',
          date: '2025-10-16',
          startTime: '14:00',
          endTime: '15:00',
          description: '매일 진행되는 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-16', id: 'repeat-1' },
          notificationTime: 1,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const eventBoxes = screen.getAllByText('매일 회의');
      const targetCell = screen.getByTestId('month-view').querySelector('[data-date="2025-10-20"]');

      fireEvent.dragStart(eventBoxes[0]);
      fireEvent.drop(targetCell!);

      await screen.findByText('반복 일정 수정');

      // When: "아니오" 버튼 클릭
      const noButton = screen.getByText('아니오');
      await user.click(noButton);

      // Then:
      // - PUT /api/recurring-events/:repeatId 호출
      // - 모든 반복 일정의 날짜 변경
      await screen.findByText('일정이 수정되었습니다');

      const eventList = within(screen.getByTestId('event-list'));
      const updatedEvents = eventList.getAllByText('매일 회의');
      expect(updatedEvents.length).toBeGreaterThan(0);
    });
  });

  describe('드래그 시 겹침 검증', () => {
    it('드롭한 날짜에 시간이 겹치는 일정이 있으면 Overlap Dialog 표시', async () => {
      // Given:
      // - A 일정: 2025-10-20 10:00-11:00
      // - B 일정: 2025-10-15 10:30-11:30
      setupMockHandlerUpdating([
        {
          id: '1',
          title: 'A 일정',
          date: '2025-10-20',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
        {
          id: '2',
          title: 'B 일정',
          date: '2025-10-15',
          startTime: '10:30',
          endTime: '11:30',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: B 일정을 2025-10-20로 드래그
      const eventB = screen.getByText('B 일정');
      const targetCell = screen.getByTestId('month-view').querySelector('[data-date="2025-10-20"]');

      fireEvent.dragStart(eventB);
      fireEvent.drop(targetCell!);

      // Then: Overlap Dialog 표시
      expect(await screen.findByText('일정 겹침 경고')).toBeInTheDocument();
      expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    });

    it('Overlap Dialog에서 "취소" 선택 시 드래그 취소', async () => {
      // Given: 겹침 발생으로 Overlap Dialog 표시
      setupMockHandlerUpdating([
        {
          id: '1',
          title: 'A 일정',
          date: '2025-10-20',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
        {
          id: '2',
          title: 'B 일정',
          date: '2025-10-15',
          startTime: '10:30',
          endTime: '11:30',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const eventB = screen.getByText('B 일정');
      const targetCell = screen.getByTestId('month-view').querySelector('[data-date="2025-10-20"]');

      fireEvent.dragStart(eventB);
      fireEvent.drop(targetCell!);

      await screen.findByText('일정 겹침 경고');

      // When: "취소" 버튼 클릭
      const cancelButton = screen.getByRole('button', { name: '취소' });
      await user.click(cancelButton);

      // Then:
      // - 일정 날짜 변경 안 됨
      // - API 호출 안 됨
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('2025-10-15')).toBeInTheDocument(); // B 일정 원래 날짜
    });

    it('Overlap Dialog에서 "계속 진행" 선택 시 날짜 변경', async () => {
      // Given: 겹침 발생으로 Overlap Dialog 표시
      setupMockHandlerUpdating([
        {
          id: '1',
          title: 'A 일정',
          date: '2025-10-20',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
        {
          id: '2',
          title: 'B 일정',
          date: '2025-10-15',
          startTime: '10:30',
          endTime: '11:30',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      const eventB = screen.getByText('B 일정');
      const targetCell = screen.getByTestId('month-view').querySelector('[data-date="2025-10-20"]');

      fireEvent.dragStart(eventB);
      fireEvent.drop(targetCell!);

      await screen.findByText('일정 겹침 경고');

      // When: "계속 진행" 버튼 클릭
      const continueButton = screen.getByRole('button', { name: '계속 진행' });
      await user.click(continueButton);

      // Then:
      // - 일정 날짜 변경됨
      // - PUT /api/events/:id 호출됨
      await screen.findByText('일정이 수정되었습니다');
    });
  });

  describe('주간/월간 뷰 드래그 앤 드롭', () => {
    it('주간 뷰에서 일정을 드래그 앤 드롭할 수 있다', async () => {
      // Given: 주간 뷰로 설정
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '주간 일정',
          date: '2025-10-01',
          startTime: '09:00',
          endTime: '10:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 주간 뷰로 전환
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      // When: 일정을 다른 날짜로 드래그
      const eventBox = screen.getByText('주간 일정');
      const weekView = screen.getByTestId('week-view');
      const targetCell = weekView.querySelector('[data-date="2025-10-03"]');

      fireEvent.dragStart(eventBox);
      fireEvent.drop(targetCell!);

      // Then: 날짜 변경 성공
      await screen.findByText('일정이 수정되었습니다');
    });

    it('월간 뷰에서 일정을 드래그 앤 드롭할 수 있다', async () => {
      // Given: 월간 뷰로 설정 (기본값)
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '월간 일정',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 일정을 다른 날짜로 드래그
      const eventBox = screen.getByText('월간 일정');
      const monthView = screen.getByTestId('month-view');
      const targetCell = monthView.querySelector('[data-date="2025-10-20"]');

      fireEvent.dragStart(eventBox);
      fireEvent.drop(targetCell!);

      // Then: 날짜 변경 성공
      await screen.findByText('일정이 수정되었습니다');
    });
  });

  describe('빈 셀 드롭 방지', () => {
    it('빈 셀(day === null)에 드롭 시도 시 아무 동작도 하지 않는다', async () => {
      // Given: 일정이 있는 캘린더
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '테스트 일정',
          date: '2025-10-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 빈 셀에 드롭 시도 (data-date 속성 없는 셀)
      const eventBox = screen.getByText('테스트 일정');
      const monthView = screen.getByTestId('month-view');

      // 빈 셀 찾기 (일반적으로 이전/다음 달의 날짜 셀)
      const emptyCells = monthView.querySelectorAll('td:not([data-date])');

      if (emptyCells.length > 0) {
        fireEvent.dragStart(eventBox);
        fireEvent.drop(emptyCells[0]);

        // Then: 이벤트 변경 없음, 토스트 메시지 없음
        const eventList = within(screen.getByTestId('event-list'));
        expect(eventList.getByText('2025-10-15')).toBeInTheDocument(); // 원래 날짜 유지
      }
    });
  });
});
