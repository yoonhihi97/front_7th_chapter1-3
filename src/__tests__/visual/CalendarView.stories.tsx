import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';

import { Event } from '../../types';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../../utils/dateUtils';

interface CalendarViewProps {
  view: 'week' | 'month';
  currentDate: Date;
  filteredEvents: Event[];
  holidays: Record<string, string>;
  setView?: (view: 'week' | 'month') => void;
  navigate?: (direction: 'prev' | 'next') => void;
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const CalendarView: React.FC<CalendarViewProps> = ({
  view,
  currentDate,
  filteredEvents,
  holidays,
}) => {
  const date = currentDate;

  if (view === 'week') {
    const weekDates = getWeekDates(date);
    return (
      <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatWeek(date)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekDates.map((d) => {
                  const dateString = formatDate(date, d.getDate());
                  return (
                    <TableCell
                      key={d.toISOString()}
                      data-date={dateString}
                      sx={{
                        height: '120px',
                        verticalAlign: 'top',
                        width: '14.28%',
                        padding: 1,
                        border: '1px solid #e0e0e0',
                        overflow: 'hidden',
                        cursor: 'default',
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {d.getDate()}
                      </Typography>
                      {filteredEvents
                        .filter((event) => new Date(event.date).toDateString() === d.toDateString())
                        .map((event) => (
                          <Box
                            key={event.id}
                            sx={{
                              p: 0.5,
                              my: 0.5,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 1,
                              minHeight: '18px',
                              width: '100%',
                              overflow: 'hidden',
                            }}
                          >
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                            >
                              {event.title}
                            </Typography>
                          </Box>
                        ))}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  }

  // Month View
  const weeks = getWeeksAtMonth(date);
  return (
    <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
      <Typography variant="h5">{formatMonth(date)}</Typography>
      <TableContainer>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              {weekDays.map((day) => (
                <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {weeks.map((week, weekIndex) => (
              <TableRow key={weekIndex}>
                {week.map((day, dayIndex) => {
                  const dateString = day ? formatDate(date, day) : '';
                  const holiday = holidays[dateString];

                  return (
                    <TableCell
                      key={dayIndex}
                      data-date={dateString || undefined}
                      sx={{
                        height: '120px',
                        verticalAlign: 'top',
                        width: '14.28%',
                        padding: 1,
                        border: '1px solid #e0e0e0',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'default',
                      }}
                    >
                      {day && (
                        <>
                          <Typography variant="body2" fontWeight="bold">
                            {day}
                          </Typography>
                          {holiday && (
                            <Typography variant="body2" color="error">
                              {holiday}
                            </Typography>
                          )}
                          {getEventsForDay(filteredEvents, day).map((event) => (
                            <Box
                              key={event.id}
                              sx={{
                                p: 0.5,
                                my: 0.5,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                                minHeight: '18px',
                                width: '100%',
                                overflow: 'hidden',
                              }}
                            >
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                              >
                                {event.title}
                              </Typography>
                            </Box>
                          ))}
                        </>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

// Mock 데이터
const mockEvents: Event[] = [
  {
    id: 'event-001',
    title: '프로젝트 기획 회의',
    date: '2024-01-15',
    startTime: '09:30',
    endTime: '10:30',
    description: '신규 프로젝트 기획안 검토',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'weekly', interval: 1, endDate: '2024-03-15' },
    notificationTime: 15,
  },
  {
    id: 'event-002',
    title: '디자인 피드백',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '15:00',
    description: 'UI/UX 디자인 검토 세션',
    location: 'Creative Lab',
    category: '업무',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 10,
  },
  {
    id: 'event-003',
    title: '피트니스',
    date: '2024-01-16',
    startTime: '17:30',
    endTime: '18:30',
    description: '주 3회 운동',
    location: '피트니스 센터',
    category: '개인',
    repeat: { type: 'weekly', interval: 1 },
    notificationTime: 30,
  },
];

const meta = {
  title: '1. 타입별 캘린더 뷰 렌더링/캘린더 뷰',
  component: CalendarView,
  parameters: {
    layout: 'fullscreen',
    chromatic: { viewports: [1024] },
  },
  argTypes: {
    view: {
      control: 'radio',
      options: ['week', 'month'],
      description: '캘린더 뷰 타입',
    },
    currentDate: { table: { disable: true } },
    filteredEvents: { table: { disable: true } },
    holidays: { table: { disable: true } },
    setView: { table: { disable: true } },
    navigate: { table: { disable: true } },
  },
} satisfies Meta<typeof CalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

// 1. 월간 뷰 - 빈 상태
export const MonthViewEmpty: Story = {
  name: '월간 뷰 - 빈 상태',
  args: {
    view: 'month',
    currentDate: new Date(2024, 0, 15), // 2024-01-15
    filteredEvents: [],
    holidays: {},
    setView: fn(),
    navigate: fn(),
  },
};

// 2. 월간 뷰 - 일정 있음
export const MonthViewWithEvents: Story = {
  name: '월간 뷰 - 일정 있음',
  args: {
    ...MonthViewEmpty.args,
    filteredEvents: mockEvents,
  },
};

// 3. 주간 뷰 - 빈 상태
export const WeekViewEmpty: Story = {
  name: '주간 뷰 - 빈 상태',
  args: {
    ...MonthViewEmpty.args,
    view: 'week',
  },
};

// 4. 주간 뷰 - 일정 있음
export const WeekViewWithEvents: Story = {
  name: '주간 뷰 - 일정 있음',
  args: {
    ...WeekViewEmpty.args,
    view: 'week',
    filteredEvents: mockEvents,
  },
};
