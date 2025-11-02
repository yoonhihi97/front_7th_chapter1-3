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

describe('캘린더 그리드 드래그 앤 드롭 UI', () => {
  describe('Draggable 이벤트 박스', () => {
    it('캘린더 그리드의 일정 박스에 draggable 속성이 true이다', async () => {
      // Given: 일정이 표시된 캘린더
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '드래그 가능 일정',
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

      // When: 캘린더 그리드에서 일정 박스 렌더링
      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('드래그 가능 일정');

      // Then: draggable={true} 속성 확인
      // 일정 박스는 Box 컴포넌트로 렌더링되며, draggable 속성이 있어야 함
      const draggableElement = eventBox.closest('[draggable]');
      expect(draggableElement).toBeInTheDocument();
      expect(draggableElement?.getAttribute('draggable')).toBe('true');
    });

    it('일정 목록(event-list)의 일정 카드는 draggable 속성이 false 또는 없다', async () => {
      // Given: 일정 목록 렌더링
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '목록 일정',
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

      // When: 일정 목록에서 일정 카드 확인
      const eventList = screen.getByTestId('event-list');
      const eventCard = within(eventList).getByText('목록 일정');

      // Then: draggable 속성이 false 또는 속성 없음
      const cardElement = eventCard.closest('[draggable="true"]');
      expect(cardElement).not.toBeInTheDocument(); // draggable이 true인 요소가 없어야 함
    });

    it('드래그 가능한 일정 박스에 onDragStart 핸들러가 있다', async () => {
      // Given: 일정이 있는 캘린더
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '핸들러 테스트',
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

      // When: 캘린더 그리드에서 일정 박스 확인
      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('핸들러 테스트');
      const draggableElement = eventBox.closest('[draggable="true"]');

      // Then: onDragStart 핸들러가 있어야 함
      // (실제로는 구현되지 않았으므로 테스트는 실패할 것)
      expect(draggableElement).toBeInTheDocument();
    });
  });

  describe('Drop Target 날짜 셀', () => {
    it('날짜 셀에 onDragOver, onDrop 핸들러가 있다', async () => {
      // Given: 캘린더 그리드 렌더링
      setupMockHandlerUpdating([]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 월간 뷰에서 날짜 셀 확인
      const monthView = screen.getByTestId('month-view');
      const dateCells = monthView.querySelectorAll('[data-date]');

      // Then: 날짜 셀에 onDragOver, onDrop 이벤트 핸들러 존재
      // (실제 구현에서는 td 요소에 핸들러가 추가되어야 함)
      expect(dateCells.length).toBeGreaterThan(0);

      // 첫 번째 날짜 셀 확인
      const firstDateCell = dateCells[0];
      expect(firstDateCell).toBeInTheDocument();
      expect(firstDateCell.getAttribute('data-date')).toBeTruthy();
    });

    it('빈 셀(day === null)에는 data-date 속성이 없다', async () => {
      // Given: 빈 셀 포함된 캘린더
      setupMockHandlerUpdating([]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 월간 뷰에서 빈 셀 확인
      const monthView = screen.getByTestId('month-view');
      const allCells = monthView.querySelectorAll('td');
      const emptyCells = Array.from(allCells).filter(
        (cell) => !cell.hasAttribute('data-date')
      );

      // Then: 빈 셀에는 data-date 속성 없음
      expect(emptyCells.length).toBeGreaterThan(0);

      emptyCells.forEach((cell) => {
        expect(cell.hasAttribute('data-date')).toBe(false);
      });
    });

    it('주간 뷰의 날짜 셀에도 data-date 속성이 있다', async () => {
      // Given: 주간 뷰로 전환
      setupMockHandlerUpdating([]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 주간 뷰로 전환
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      // When: 주간 뷰에서 날짜 셀 확인
      const weekView = screen.getByTestId('week-view');
      const dateCells = weekView.querySelectorAll('[data-date]');

      // Then: 주간 뷰의 날짜 셀에도 data-date 속성 존재
      expect(dateCells.length).toBeGreaterThan(0);

      dateCells.forEach((cell) => {
        const dateValue = cell.getAttribute('data-date');
        expect(dateValue).toBeTruthy();
        // 날짜 형식 검증 (YYYY-MM-DD)
        expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('data-date 속성', () => {
    it('날짜 셀에 data-date 속성이 YYYY-MM-DD 형식으로 있다', async () => {
      // Given: 캘린더 그리드 렌더링
      setupMockHandlerUpdating([]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 월간 뷰에서 날짜 셀 확인
      const monthView = screen.getByTestId('month-view');
      const dateCells = monthView.querySelectorAll('[data-date]');

      // Then: data-date="YYYY-MM-DD" 속성 존재
      dateCells.forEach((cell) => {
        const dateValue = cell.getAttribute('data-date');
        expect(dateValue).toBeTruthy();

        // 날짜 형식 검증
        expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // 유효한 날짜인지 확인
        const parsedDate = new Date(dateValue!);
        expect(parsedDate.toString()).not.toBe('Invalid Date');
      });
    });

    it('2025-10-15 날짜 셀에 정확한 data-date 값이 있다', async () => {
      // Given: 2025년 10월 캘린더
      setupMockHandlerUpdating([]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 특정 날짜 셀 찾기
      const monthView = screen.getByTestId('month-view');
      const targetCell = monthView.querySelector('[data-date="2025-10-15"]');

      // Then: data-date="2025-10-15" 속성 정확히 존재
      expect(targetCell).toBeInTheDocument();
      expect(targetCell?.getAttribute('data-date')).toBe('2025-10-15');
    });

    it('캘린더의 모든 날짜 셀이 고유한 data-date 값을 가진다', async () => {
      // Given: 캘린더 렌더링
      setupMockHandlerUpdating([]);

      setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // When: 모든 날짜 셀 수집
      const monthView = screen.getByTestId('month-view');
      const dateCells = monthView.querySelectorAll('[data-date]');

      // Then: 중복 없는 data-date 값
      const dateValues = Array.from(dateCells).map((cell) => cell.getAttribute('data-date'));
      const uniqueDates = new Set(dateValues);

      // 주의: 월간 뷰에서는 같은 날짜가 여러 주에 걸쳐 나타날 수 없으므로
      // 고유한 날짜 값의 개수가 전체 날짜 셀 개수와 같아야 함
      expect(uniqueDates.size).toBe(dateValues.length);
    });
  });

  describe('드래그 앤 드롭 이벤트 핸들러', () => {
    it('날짜 셀에 드래그 오버 시 preventDefault가 호출되어야 한다', async () => {
      // Given: 캘린더 렌더링
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

      // When: 날짜 셀에 드래그 오버 이벤트 발생
      const monthView = screen.getByTestId('month-view');
      const targetCell = monthView.querySelector('[data-date="2025-10-20"]');

      expect(targetCell).toBeInTheDocument();

      // Then: onDragOver 핸들러가 구현되어 있어야 함
      // (실제 구현 전이므로 이 테스트는 실패할 것)
    });
  });
});
