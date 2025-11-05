import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';

type Story = StoryObj<typeof RecurringEditDialogComponent>;

interface RecurringEditDialogComponentProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (editSingleOnly: boolean) => void;
}

const BUTTON_TEXT = {
  cancel: '취소',
  no: '아니오',
  yes: '예',
} as const;

const RecurringEditDialogComponent: React.FC<RecurringEditDialogComponentProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const handleSingleOperation = () => {
    onConfirm(true);
  };

  const handleSeriesOperation = () => {
    onConfirm(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>반복 일정 수정</DialogTitle>
      <DialogContent>
        <Typography>해당 일정만 수정하시겠어요?</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'gray' }}>
          아니오를 선택하면 모든 반복 일정이 수정됩니다.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {BUTTON_TEXT.cancel}
        </Button>
        <Button onClick={handleSeriesOperation} variant="outlined" color="primary">
          {BUTTON_TEXT.no}
        </Button>
        <Button onClick={handleSingleOperation} variant="contained" color="primary">
          {BUTTON_TEXT.yes}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const meta = {
  title: '3. 다이얼로그 및 모달/반복 일정 수정',
  component: RecurringEditDialogComponent,
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
  },
} satisfies Meta<typeof RecurringEditDialogComponent>;

export default meta;

export const RecurringEventEdit: Story = {
  name: '반복 일정 수정',
  args: {
    open: true,
    onClose: fn(),
    onConfirm: fn(),
  },
};
