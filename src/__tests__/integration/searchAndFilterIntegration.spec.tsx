import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';

import { setupMockHandlerCreation, setupMockHandlerUpdating } from '../../__mocks__/handlersUtils';
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

describe('검색/필터링 통합 테스트', () => {
  describe('뷰 타입별 일정 표시', () => {
    it('월간 뷰에서 연도 경계를 넘을 때 (2025년 12월 → 2026년 1월) 일정이 정확히 필터링된다', async () => {
      // 시스템 시간을 2025-12-01로 설정
      vi.setSystemTime(new Date('2025-12-01'));

      // 2025년 12월과 2026년 1월 일정 생성
      setupMockHandlerUpdating([
        {
          id: '1',
          title: '2025년 12월 회의',
          date: '2025-12-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '2025년 마지막 달 일정',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '2025년 12월 송년회',
          date: '2025-12-31',
          startTime: '18:00',
          endTime: '20:00',
          description: '송년회',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '3',
          title: '2026년 1월 신년회',
          date: '2026-01-01',
          startTime: '10:00',
          endTime: '12:00',
          description: '새해 첫 모임',
          location: '회의실 C',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '4',
          title: '2026년 1월 킥오프',
          date: '2026-01-15',
          startTime: '14:00',
          endTime: '16:00',
          description: '2026년 시작',
          location: '회의실 D',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);
      await screen.findByText('일정 로딩 완료!');

      // 초기 상태: 2025년 12월
      const eventList = within(screen.getByTestId('event-list'));

      expect(eventList.getByText('2025년 12월 회의')).toBeInTheDocument();
      expect(eventList.getByText('2025년 12월 송년회')).toBeInTheDocument();
      expect(eventList.queryByText('2026년 1월 신년회')).not.toBeInTheDocument();
      expect(eventList.queryByText('2026년 1월 킥오프')).not.toBeInTheDocument();

      // 다음 달로 이동 (2026년 1월)
      const nextButton = screen.getByLabelText('Next');
      await user.click(nextButton);

      // 2026년 1월 일정만 표시되어야 함
      expect(eventList.queryByText('2025년 12월 회의')).not.toBeInTheDocument();
      expect(eventList.queryByText('2025년 12월 송년회')).not.toBeInTheDocument();
      expect(eventList.getByText('2026년 1월 신년회')).toBeInTheDocument();
      expect(eventList.getByText('2026년 1월 킥오프')).toBeInTheDocument();

      // 이전 달로 이동 (2025년 12월)
      const prevButton = screen.getByLabelText('Previous');
      await user.click(prevButton);

      // 다시 2025년 12월 일정만 표시
      expect(eventList.getByText('2025년 12월 회의')).toBeInTheDocument();
      expect(eventList.getByText('2025년 12월 송년회')).toBeInTheDocument();
      expect(eventList.queryByText('2026년 1월 신년회')).not.toBeInTheDocument();
      expect(eventList.queryByText('2026년 1월 킥오프')).not.toBeInTheDocument();
    });

    it('주간 뷰에서 다음 달로 넘어가는 주의 일정이 검색 목록에 올바르게 표시된다', async () => {
      // 10월 말 근처 날짜로 설정 (2025-10-29, 수요일)
      // 이 날짜의 주는 10월 27일(일) ~ 11월 2일(토)가 됨
      vi.setSystemTime(new Date('2025-10-29'));

      setupMockHandlerCreation([
        {
          id: '1',
          title: '다음 달 회의',
          date: '2025-11-01',
          startTime: '09:00',
          endTime: '10:00',
          description: '다음 달 회의입니다.',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);

      // 일정 로딩 완료 대기
      await screen.findByText('일정 로딩 완료!');

      // 주별 뷰 선택
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      // 검색 목록에서 다음 달 일정이 표시되는지 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('다음 달 회의')).toBeInTheDocument();
    });

    it('주간 뷰에서 다음 달로 넘어가는 주의 일정이 검색어로 검색된다', async () => {
      // 10월 말 근처 날짜로 설정 (2025-10-29, 수요일)
      // 이 날짜의 주는 10월 27일(일) ~ 11월 2일(토)가 됨
      vi.setSystemTime(new Date('2025-10-29'));

      setupMockHandlerCreation([
        {
          id: '1',
          title: '다음 달 회의',
          date: '2025-11-01',
          startTime: '09:00',
          endTime: '10:00',
          description: '다음 달 회의입니다.',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '다른 일정',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '다른 일정입니다.',
          location: '회의실 B',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]);

      const { user } = setup(<App />);

      // 일정 로딩 완료 대기
      await screen.findByText('일정 로딩 완료!');

      // 주별 뷰 선택
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      // 검색어 입력 (다음 달 회의 검색)
      const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
      await user.type(searchInput, '다음 달');

      // 검색 결과에서 다음 달 일정이 표시되는지 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('다음 달 회의')).toBeInTheDocument();
      // 다른 일정은 검색 결과에서 제외되어야 함
      expect(eventList.queryByText('다른 일정')).not.toBeInTheDocument();
    });
  });
});
