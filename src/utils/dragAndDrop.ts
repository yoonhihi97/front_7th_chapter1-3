import React from 'react';

import { Event } from '../types';

/**
 * 드래그 시작 이벤트 핸들러
 * dataTransfer에 이벤트 ID를 저장하고 effectAllowed를 설정합니다.
 */
export const handleDragStart = (e: React.DragEvent<HTMLElement>, eventId: string) => {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('eventId', eventId);
};

/**
 * 드롭 타겟 요소에서 data-date 속성을 추출합니다.
 * data-date 속성이 없으면 부모 요소를 재귀적으로 탐색합니다.
 */
export const extractDateFromDropTarget = (element: Element | null): string | null => {
  if (!element) return null;

  const dataDate = element.getAttribute('data-date');
  if (dataDate) return dataDate;

  // 부모 요소에서 data-date 찾기
  if (element.parentElement) {
    return extractDateFromDropTarget(element.parentElement);
  }

  return null;
};

/**
 * 이벤트의 날짜만 변경하고 시간은 유지합니다.
 */
export const changeDateOnly = (event: Event, newDate: string): Event => {
  return {
    ...event,
    date: newDate,
  };
};

/**
 * 드롭 이벤트를 처리합니다.
 * - 유효한 날짜 셀에 드롭 시 날짜만 변경된 이벤트 객체 반환
 * - 빈 셀에 드롭 시 null 반환
 */
export const handleDrop = (e: React.DragEvent<HTMLElement>, event: Event): Event | null => {
  // preventDefault와 stopPropagation이 존재하는지 확인
  if (typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }

  // 드롭 타겟에서 날짜 추출
  const newDate = extractDateFromDropTarget(e.currentTarget);

  // 날짜가 없으면 (빈 셀) 무시
  if (!newDate) {
    return null;
  }

  // 날짜만 변경
  return changeDateOnly(event, newDate);
};
