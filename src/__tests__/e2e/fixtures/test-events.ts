import { EventForm } from '../../../types';

/**
 * E2E 테스트용 기본 이벤트 데이터
 */
export const basicEvent: EventForm = {
  title: '팀 회의',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '프로젝트 진행 상황 논의',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

/**
 * 최소 필드만 포함한 이벤트 데이터 (설명, 위치 없음)
 */
export const minimalEvent: EventForm = {
  title: '간단한 일정',
  date: '2025-10-16',
  startTime: '10:00',
  endTime: '11:00',
  description: '',
  location: '',
  category: '',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

/**
 * 수정/삭제 테스트용 기본 이벤트
 */
export const existingEvent: EventForm = {
  title: '기존 회의',
  date: '2025-10-20',
  startTime: '09:00',
  endTime: '10:00',
  description: '기존 팀 미팅',
  location: '회의실 B',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

/**
 * 조회 테스트용 이벤트
 */
export const lunchEvent: EventForm = {
  title: '점심 약속',
  date: '2025-10-15',
  startTime: '12:00',
  endTime: '13:00',
  description: '팀원들과 점심',
  location: '강남역 레스토랑',
  category: '개인',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

/**
 * 삭제 테스트용 이벤트
 */
export const deleteEvent: EventForm = {
  title: '삭제할 일정',
  date: '2025-10-15',
  startTime: '09:00',
  endTime: '10:00',
  description: '삭제 테스트',
  location: '어딘가',
  category: '기타',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

/**
 * 겹치는 일정 테스트용 이벤트
 */
export const overlappingEvent: EventForm = {
  title: '기존 일정',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '',
  location: '',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

export const conflictingEvent: EventForm = {
  title: '겹치는 일정',
  date: '2025-10-15',
  startTime: '14:30',
  endTime: '15:30',
  description: '',
  location: '',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

/**
 * 여러 일정 테스트용 이벤트 배열
 */
export const multipleEvents: EventForm[] = [
  {
    title: '일정 1',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '10:00',
    description: '첫 번째 일정',
    location: '',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    title: '일정 2',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '두 번째 일정',
    location: '',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    title: '일정 3',
    date: '2025-10-17',
    startTime: '14:00',
    endTime: '15:00',
    description: '세 번째 일정',
    location: '',
    category: '가족',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
];

/**
 * 카테고리 테스트용 이벤트
 */
export const categoryEvent: EventForm = {
  title: '카테고리 테스트',
  date: '2025-10-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '',
  location: '',
  category: '가족',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};
