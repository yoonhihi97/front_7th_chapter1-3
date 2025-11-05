import Notifications from '@mui/icons-material/Notifications';
import Repeat from '@mui/icons-material/Repeat';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

type Story = StoryObj<typeof EventCellComponent>;

interface EventCellComponentProps {
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

const EventCellComponent: React.FC<EventCellComponentProps> = ({
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
  title: '3. 셀 텍스트 길이 처리/이벤트 셀',
  component: EventCellComponent,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [1024] },
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: '150px', border: '1px solid #ccc', p: 2 }}>
        <Story />
      </Box>
    ),
  ],
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
} satisfies Meta<typeof EventCellComponent>;

export default meta;

// 1. 짧은 텍스트 - 전체 표시
export const ShortText: Story = {
  name: '짧은 제목 - 전체 표시',
  args: {
    title: '회의',
    isNotified: false,
    isRepeating: false,
  },
};

// 2. 중간 길이 텍스트 - 말줄임 시작
export const MediumText: Story = {
  name: '중간 길이 제목 - 말줄임',
  args: {
    title: '디자인 피드백 세션',
    isNotified: false,
    isRepeating: false,
  },
};

// 3. 긴 텍스트 - 말줄임 처리
export const LongText: Story = {
  name: '긴 제목 - 말줄임 처리',
  args: {
    title: '매우 긴 회의 제목을 가진 이벤트 예제 테스트',
    isNotified: false,
    isRepeating: false,
  },
};

// 4. 아이콘 + 긴 텍스트 - 공간 부족 상황
export const IconsWithLongText: Story = {
  name: '아이콘 + 긴 제목 - 공간 경합',
  args: {
    title: '매우 긴 회의 제목을 가진 이벤트 예제 테스트',
    isNotified: true,
    isRepeating: true,
  },
};

// 5. 짧은 텍스트 + 아이콘
export const IconsWithShortText: Story = {
  name: '아이콘 + 짧은 제목',
  args: {
    title: '회의',
    isNotified: true,
    isRepeating: true,
  },
};
