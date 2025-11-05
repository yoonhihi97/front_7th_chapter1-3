import Notifications from '@mui/icons-material/Notifications';
import Repeat from '@mui/icons-material/Repeat';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

type Story = StoryObj<typeof EventBoxComponent>;

interface EventBoxComponentProps {
  title: string;
  isNotified: boolean;
  isRepeating: boolean;
}

const eventBoxStyles = {
  notified: {
    backgroundColor: '#ffebee',
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  normal: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'normal',
    color: 'inherit',
  },
  common: {
    p: 0.5,
    my: 0.5,
    borderRadius: 1,
    minHeight: '18px',
    width: '100%',
    overflow: 'hidden',
  },
};

const EventBoxComponent: React.FC<EventBoxComponentProps> = ({
  title,
  isNotified,
  isRepeating,
}) => {
  return (
    <Box
      sx={{
        ...eventBoxStyles.common,
        ...(isNotified ? eventBoxStyles.notified : eventBoxStyles.normal),
        cursor: 'move',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {isNotified && <Notifications fontSize="small" />}
        {isRepeating && (
          <Tooltip title="반복 일정">
            <Repeat fontSize="small" />
          </Tooltip>
        )}
        <Typography variant="caption" noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
          {title}
        </Typography>
      </Stack>
    </Box>
  );
};

const meta = {
  title: '2. 일정 상태별 시각적 표현/일정 박스',
  component: EventBoxComponent,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [400] },
  },
  argTypes: {
    isNotified: {
      control: 'boolean',
      description: '알림 상태 여부',
    },
    isRepeating: {
      control: 'boolean',
      description: '반복 일정 여부',
    },
    title: {
      control: 'text',
      description: '일정 제목',
    },
  },
} satisfies Meta<typeof EventBoxComponent>;

export default meta;

export const DefaultState: Story = {
  name: '기본 상태',
  args: {
    title: '프로젝트 기획 회의',
    isNotified: false,
    isRepeating: false,
  },
};

export const NotifiedState: Story = {
  name: '알림 상태',
  args: {
    title: '디자인 피드백 세션',
    isNotified: true,
    isRepeating: false,
  },
};

export const RepeatingEvent: Story = {
  name: '반복 일정',
  args: {
    title: '주간 팀 미팅',
    isNotified: false,
    isRepeating: true,
  },
};

export const NotifiedAndRepeating: Story = {
  name: '알림 + 반복',
  args: {
    title: '일일 스탠드업',
    isNotified: true,
    isRepeating: true,
  },
};
