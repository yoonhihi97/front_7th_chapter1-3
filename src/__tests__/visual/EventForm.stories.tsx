import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React, { useState } from 'react';

type Story = StoryObj<typeof EventFormComponent>;

interface EventFormComponentProps {
  mode?: 'create' | 'edit';
  hasError?: boolean;
}

const categories = ['업무', '개인', '가족', '기타'];
const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

const EventFormComponent: React.FC<EventFormComponentProps> = ({
  mode = 'create',
  hasError = false,
}) => {
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatType, setRepeatType] = useState('daily');

  const startTimeError = hasError ? '시작 시간이 종료 시간보다 늦을 수 없습니다' : '';
  const endTimeError = hasError ? '종료 시간이 시작 시간보다 빨라야 합니다' : '';

  return (
    <Stack spacing={2} sx={{ width: '400px' }}>
      <FormControl fullWidth>
        <FormLabel htmlFor="title">제목</FormLabel>
        <TextField
          id="title"
          size="small"
          placeholder="일정 제목을 입력하세요"
          defaultValue={mode === 'edit' ? '프로젝트 기획 회의' : ''}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="date">날짜</FormLabel>
        <TextField
          id="date"
          size="small"
          type="date"
          defaultValue={mode === 'edit' ? '2024-01-15' : ''}
        />
      </FormControl>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <FormLabel htmlFor="start-time">시작 시간</FormLabel>
          <TextField
            id="start-time"
            size="small"
            type="time"
            defaultValue={mode === 'edit' ? '09:30' : ''}
            error={!!startTimeError}
            slotProps={{
              input: {
                'aria-invalid': !!startTimeError,
              },
            }}
          />
          {startTimeError && (
            <Box sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.5 }}>{startTimeError}</Box>
          )}
        </FormControl>
        <FormControl fullWidth>
          <FormLabel htmlFor="end-time">종료 시간</FormLabel>
          <TextField
            id="end-time"
            size="small"
            type="time"
            defaultValue={mode === 'edit' ? '10:30' : ''}
            error={!!endTimeError}
            slotProps={{
              input: {
                'aria-invalid': !!endTimeError,
              },
            }}
          />
          {endTimeError && (
            <Box sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.5 }}>{endTimeError}</Box>
          )}
        </FormControl>
      </Stack>

      <FormControl fullWidth>
        <FormLabel htmlFor="description">설명</FormLabel>
        <TextField
          id="description"
          size="small"
          multiline
          rows={2}
          placeholder="일정 설명을 입력하세요"
          defaultValue={mode === 'edit' ? '신규 프로젝트 기획안 검토' : ''}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="location">위치</FormLabel>
        <TextField
          id="location"
          size="small"
          placeholder="장소를 입력하세요"
          defaultValue={mode === 'edit' ? '회의실 B' : ''}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel id="category-label">카테고리</FormLabel>
        <Select
          id="category"
          size="small"
          defaultValue={mode === 'edit' ? '업무' : ''}
          aria-labelledby="category-label"
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {mode === 'create' && (
        <FormControl>
          <FormControlLabel
            control={
              <Checkbox checked={isRepeating} onChange={(e) => setIsRepeating(e.target.checked)} />
            }
            label="반복 일정"
          />
        </FormControl>
      )}

      {isRepeating && (
        <Stack spacing={2}>
          <FormControl fullWidth>
            <FormLabel>반복 유형</FormLabel>
            <Select size="small" value={repeatType} onChange={(e) => setRepeatType(e.target.value)}>
              <MenuItem value="daily">매일</MenuItem>
              <MenuItem value="weekly">매주</MenuItem>
              <MenuItem value="monthly">매월</MenuItem>
              <MenuItem value="yearly">매년</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
              <TextField
                id="repeat-interval"
                size="small"
                type="number"
                defaultValue="1"
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
              <TextField id="repeat-end-date" size="small" type="date" />
            </FormControl>
          </Stack>
        </Stack>
      )}

      <FormControl fullWidth>
        <FormLabel htmlFor="notification">알림 설정</FormLabel>
        <Select id="notification" size="small" defaultValue={mode === 'edit' ? 15 : 10}>
          {notificationOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button onClick={fn()} variant="contained" color="primary" fullWidth>
        {mode === 'edit' ? '일정 수정' : '일정 추가'}
      </Button>
    </Stack>
  );
};

const meta = {
  title: '4. 폼 컨트롤 상태/이벤트 폼',
  component: EventFormComponent,
  parameters: {
    layout: 'centered',
    chromatic: { viewports: [600] },
  },
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: '폼 모드 (생성/수정)',
    },
    hasError: {
      control: 'boolean',
      description: '검증 오류 상태',
    },
  },
} satisfies Meta<typeof EventFormComponent>;

export default meta;

export const CreateEventForm: Story = {
  name: '일정 생성 - 빈 상태',
  args: {
    mode: 'create',
    hasError: false,
  },
};

export const EditEventForm: Story = {
  name: '일정 수정 - 입력된 상태',
  args: {
    mode: 'edit',
    hasError: false,
  },
};

export const CreateWithRepeating: Story = {
  name: '일정 생성 - 반복 설정',
  render: (args) => {
    const RepeatingFormWrapper = () => {
      const [isRepeating, setIsRepeating] = useState(true);
      const [repeatType, setRepeatType] = useState('weekly');

      const startTimeError = args.hasError ? '시작 시간이 종료 시간보다 늦을 수 없습니다' : '';
      const endTimeError = args.hasError ? '종료 시간이 시작 시간보다 빨라야 합니다' : '';

      return (
        <Stack spacing={2} sx={{ width: '400px' }}>
          <FormControl fullWidth>
            <FormLabel htmlFor="title">제목</FormLabel>
            <TextField id="title" size="small" placeholder="일정 제목을 입력하세요" />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="date">날짜</FormLabel>
            <TextField id="date" size="small" type="date" />
          </FormControl>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <FormLabel htmlFor="start-time">시작 시간</FormLabel>
              <TextField
                id="start-time"
                size="small"
                type="time"
                error={!!startTimeError}
                slotProps={{
                  input: {
                    'aria-invalid': !!startTimeError,
                  },
                }}
              />
              {startTimeError && (
                <Box sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.5 }}>{startTimeError}</Box>
              )}
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="end-time">종료 시간</FormLabel>
              <TextField
                id="end-time"
                size="small"
                type="time"
                error={!!endTimeError}
                slotProps={{
                  input: {
                    'aria-invalid': !!endTimeError,
                  },
                }}
              />
              {endTimeError && (
                <Box sx={{ color: '#d32f2f', fontSize: '0.75rem', mt: 0.5 }}>{endTimeError}</Box>
              )}
            </FormControl>
          </Stack>

          <FormControl fullWidth>
            <FormLabel htmlFor="description">설명</FormLabel>
            <TextField
              id="description"
              size="small"
              multiline
              rows={2}
              placeholder="일정 설명을 입력하세요"
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="location">위치</FormLabel>
            <TextField id="location" size="small" placeholder="장소를 입력하세요" />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel id="category-label">카테고리</FormLabel>
            <Select id="category" size="small" defaultValue="" aria-labelledby="category-label">
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRepeating}
                  onChange={(e) => setIsRepeating(e.target.checked)}
                />
              }
              label="반복 일정"
            />
          </FormControl>

          {isRepeating && (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <FormLabel>반복 유형</FormLabel>
                <Select
                  size="small"
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value)}
                >
                  <MenuItem value="daily">매일</MenuItem>
                  <MenuItem value="weekly">매주</MenuItem>
                  <MenuItem value="monthly">매월</MenuItem>
                  <MenuItem value="yearly">매년</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
                  <TextField
                    id="repeat-interval"
                    size="small"
                    type="number"
                    defaultValue="1"
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
                  <TextField id="repeat-end-date" size="small" type="date" />
                </FormControl>
              </Stack>
            </Stack>
          )}

          <FormControl fullWidth>
            <FormLabel htmlFor="notification">알림 설정</FormLabel>
            <Select id="notification" size="small" defaultValue={10}>
              {notificationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button onClick={fn()} variant="contained" color="primary" fullWidth>
            일정 추가
          </Button>
        </Stack>
      );
    };

    return <RepeatingFormWrapper />;
  },
};

export const FormWithValidationError: Story = {
  name: '검증 오류 상태',
  args: {
    mode: 'create',
    hasError: true,
  },
};
