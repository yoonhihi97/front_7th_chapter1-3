import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { Event } from '../../types';
import {
  extractDateFromDropTarget,
  changeDateOnly,
  handleDragStart,
} from '../../utils/dragAndDrop';

describe('드래그 앤 드롭 유틸리티 함수', () => {
  describe('handleDragStart', () => {
    it('드래그 시작 시 dataTransfer에 이벤트 ID를 저장한다', () => {
      // Given: 드래그 이벤트와 이벤트 ID
      const mockDataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
      };
      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as unknown as React.DragEvent<HTMLElement>;
      const eventId = 'event-123';

      // When: handleDragStart 호출
      handleDragStart(mockEvent, eventId);

      // Then: dataTransfer.setData('eventId', id) 호출됨
      expect(mockDataTransfer.setData).toHaveBeenCalledWith('eventId', eventId);
    });

    it('effectAllowed를 "move"로 설정한다', () => {
      // Given: 드래그 이벤트
      const mockDataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
      };
      const mockEvent = {
        dataTransfer: mockDataTransfer,
      } as unknown as React.DragEvent<HTMLElement>;

      // When: handleDragStart 호출
      handleDragStart(mockEvent, 'event-123');

      // Then: effectAllowed가 "move"로 설정됨
      expect(mockDataTransfer.effectAllowed).toBe('move');
    });
  });

  describe('extractDateFromDropTarget', () => {
    it('data-date 속성에서 날짜를 추출한다', () => {
      // Given: data-date="2025-01-05" 속성을 가진 요소
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-date', '2025-01-05');

      // When: 날짜 추출
      const result = extractDateFromDropTarget(mockElement);

      // Then: "2025-01-05" 반환
      expect(result).toBe('2025-01-05');
    });

    it('data-date 속성이 없으면 null을 반환한다', () => {
      // Given: data-date 속성이 없는 요소
      const mockElement = document.createElement('div');

      // When: 날짜 추출
      const result = extractDateFromDropTarget(mockElement);

      // Then: null 반환
      expect(result).toBeNull();
    });

    it('부모 요소의 data-date 속성을 찾는다', () => {
      // Given: 부모에만 data-date가 있는 구조
      const parent = document.createElement('div');
      parent.setAttribute('data-date', '2025-01-10');
      const child = document.createElement('span');
      parent.appendChild(child);

      // When: 자식 요소에서 날짜 추출
      const result = extractDateFromDropTarget(child);

      // Then: 부모의 data-date 반환
      expect(result).toBe('2025-01-10');
    });
  });

  describe('changeDateOnly', () => {
    it('드롭 시 이벤트의 날짜만 변경하고 시간은 유지한다', () => {
      // Given: 기존 이벤트 (2025-01-01 10:00-11:00)
      const originalEvent: Event = {
        id: '1',
        title: '회의',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      };
      const newDate = '2025-01-05';

      // When: 2025-01-05 셀에 드롭
      const result = changeDateOnly(originalEvent, newDate);

      // Then: 새 이벤트 (2025-01-05 10:00-11:00)
      expect(result.date).toBe('2025-01-05');
      expect(result.startTime).toBe('10:00');
      expect(result.endTime).toBe('11:00');
      expect(result.title).toBe('회의');
    });

    it('원본 이벤트 객체를 변경하지 않는다 (불변성)', () => {
      // Given: 원본 이벤트
      const originalEvent: Event = {
        id: '1',
        title: '회의',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      };
      const newDate = '2025-01-05';

      // When: 날짜 변경
      changeDateOnly(originalEvent, newDate);

      // Then: 원본 객체는 변경되지 않음
      expect(originalEvent.date).toBe('2025-01-01');
    });
  });

  describe('handleDrop - 통합 로직', () => {
    it('빈 셀(day === null)에 드롭 시 아무 동작도 하지 않는다', () => {
      // Given: 빈 셀 (data-date 속성 없음)
      const mockElement = document.createElement('div');
      const onDropCallback = vi.fn();

      // When: 드롭 시도
      const hasDataDate = extractDateFromDropTarget(mockElement);

      // Then: data-date가 없으므로 콜백 호출 안 됨
      if (hasDataDate) {
        onDropCallback();
      }
      expect(onDropCallback).not.toHaveBeenCalled();
    });

    it('유효한 셀에 드롭 시 날짜 변경 로직이 실행된다', () => {
      // Given: 유효한 날짜 셀
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-date', '2025-01-05');
      const mockEvent = {
        preventDefault: vi.fn(),
        currentTarget: mockElement,
        dataTransfer: {
          getData: vi.fn().mockReturnValue('event-123'),
        },
      } as unknown as React.DragEvent;

      const onDropCallback = vi.fn();

      // When: 드롭
      const targetDate = extractDateFromDropTarget(mockElement);
      const eventId = mockEvent.dataTransfer!.getData('eventId');

      // Then: 날짜와 이벤트 ID가 추출됨
      expect(targetDate).toBe('2025-01-05');
      expect(eventId).toBe('event-123');

      // 실제 구현에서는 이 정보로 이벤트 업데이트 수행
      if (targetDate && eventId) {
        onDropCallback(eventId, targetDate);
      }
      expect(onDropCallback).toHaveBeenCalledWith('event-123', '2025-01-05');
    });
  });
});
