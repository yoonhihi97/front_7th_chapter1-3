import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';

import { Event } from '../../types';

type Story = StoryObj<typeof OverlapDialogComponent>;

interface OverlapDialogComponentProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  overlappingEvents: Event[];
}

const OverlapDialogComponent: React.FC<OverlapDialogComponentProps> = ({
  open,
  onClose,
  onConfirm,
  overlappingEvents,
}) => {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>일정 겹침 경고</DialogTitle>
      <DialogContent>
        <DialogContentText>다음 일정과 겹칩니다:</DialogContentText>
        {overlappingEvents.map((event) => (
          <Typography key={event.id} sx={{ ml: 1, mb: 1 }}>
            {event.title} ({event.date} {event.startTime}-{event.endTime})
          </Typography>
        ))}
        <DialogContentText sx={{ mt: 2 }}>계속 진행하시겠습니까?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          계속 진행
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const meta = {
  title: '3. 다이얼로그 및 모달/일정 겹침 경고',
  component: OverlapDialogComponent,
  parameters: {
    layout: 'fullscreen',
    chromatic: { viewports: [1024] },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: '다이얼로그 열림 상태',
    },
    onClose: { table: { disable: true } },
    onConfirm: { table: { disable: true } },
    overlappingEvents: { table: { disable: true } },
  },
} satisfies Meta<typeof OverlapDialogComponent>;

export default meta;

// Mock data
const singleEvent: Event = {
  id: 'event-001',
  title: '프로젝트 기획 회의',
  date: '2024-01-15',
  startTime: '09:30',
  endTime: '10:30',
  description: '신규 프로젝트 기획안 검토',
  location: '회의실 B',
  category: '업무',
  repeat: { type: 'none', interval: 1 },
  notificationTime: 15,
};

const recurringEvent: Event = {
  id: 'event-002',
  title: '주간 팀 미팅',
  date: '2024-01-16',
  startTime: '10:00',
  endTime: '11:00',
  description: '주간 팀 회의',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'weekly', interval: 1, endDate: '2024-03-31' },
  notificationTime: 10,
};

export const SingleEventOverlap: Story = {
  name: '단일 일정 겹침',
  args: {
    open: true,
    overlappingEvents: [singleEvent],
    onClose: fn(),
    onConfirm: fn(),
  },
};

export const RecurringEventOverlap: Story = {
  name: '반복 일정 겹침',
  args: {
    open: true,
    overlappingEvents: [recurringEvent],
    onClose: fn(),
    onConfirm: fn(),
  },
};
