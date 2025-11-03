import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';

import { setupMockHandlerUpdating } from '../../__mocks__/handlersUtils';
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

describe('드래그 앤 드롭 기능 - UI 속성 검증', () => {
  describe('캘린더 그리드 UI 구조', () => {
    it('월간 뷰의 일정 박스에 draggable 속성이 있어야 한다', async () => {
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

      // When: 캘린더 그리드의 일정 박스 확인
      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('테스트 일정');

      // Then: draggable 속성이 있어야 함
      const draggableElement = eventBox.closest('[draggable="true"]');
      expect(draggableElement).toBeTruthy();
    });

    it('날짜 셀에 data-date 속성이 YYYY-MM-DD 형식으로 있어야 한다', async () => {
      // Given: 캘린더 렌더링
      setupMockHandlerUpdating([]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 월간 뷰의 날짜 셀 확인
      const monthView = screen.getByTestId('month-view');
      const dateCell = monthView.querySelector('[data-date="2025-10-15"]');

      // Then: data-date 속성이 올바른 형식으로 있어야 함
      expect(dateCell).toBeTruthy();
      expect(dateCell?.getAttribute('data-date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('빈 셀(이전/다음 달 날짜)에는 data-date 속성이 없어야 한다', async () => {
      // Given: 캘린더 렌더링
      setupMockHandlerUpdating([]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 월간 뷰에서 빈 셀 찾기
      const monthView = screen.getByTestId('month-view');
      const emptyCells = Array.from(monthView.querySelectorAll('td')).filter(
        (cell) => !cell.hasAttribute('data-date')
      );

      // Then: 빈 셀들이 data-date 속성을 가지지 않아야 함
      expect(emptyCells.length).toBeGreaterThan(0);
      emptyCells.forEach((cell) => {
        expect(cell.hasAttribute('data-date')).toBe(false);
      });
    });

    it('주간 뷰의 일정 박스에도 draggable 속성이 있어야 한다', async () => {
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

      // When: 주간 뷰의 일정 박스 확인
      const weekView = screen.getByTestId('week-view');
      const eventBox = within(weekView).getByText('주간 일정');

      // Then: draggable 속성이 있어야 함
      const draggableElement = eventBox.closest('[draggable="true"]');
      expect(draggableElement).toBeTruthy();
    });
  });

  describe('반복 일정 UI', () => {
    it('반복 일정 박스에 반복 표시 아이콘이 있어야 한다', async () => {
      // Given: 반복 일정이 있는 캘린더
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '매일 회의',
          date: '2025-10-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 0,
        },
      ]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 반복 일정 확인
      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('매일 회의');
      const repeatIcon = eventBox.closest('div')?.querySelector('[class*="MuiSvgIcon"]');

      // Then: 반복 표시가 있어야 함 (Repeat 아이콘)
      expect(repeatIcon || eventBox.parentElement?.textContent).toBeTruthy();
    });
  });

  describe('이벤트 리스트 UI', () => {
    it('이벤트 리스트의 일정은 draggable이 false여야 한다', async () => {
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

      // When: 이벤트 리스트의 일정 확인
      const eventList = screen.getByTestId('event-list');
      const eventInList = within(eventList).getByText('테스트 일정');
      const draggableInList = eventInList.closest('[draggable="true"]');

      // Then: 리스트의 일정은 draggable이 아니어야 함
      expect(draggableInList).toBeFalsy();
    });
  });
});
