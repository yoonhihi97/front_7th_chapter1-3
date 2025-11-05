/* global RequestInit */

import { Event } from '../types';

/**
 * API endpoints for recurring event operations
 */
const API_ENDPOINTS = {
  events: '/api/events',
  recurringEvents: '/api/recurring-events',
} as const;

/**
 * HTTP method constants
 */
const HTTP_METHODS = {
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

/**
 * Default event repeat configuration for non-recurring events
 */
const DEFAULT_REPEAT_CONFIG = {
  type: 'none' as const,
  interval: 0,
};

/**
 * Custom hook for managing recurring event operations
 * Provides functionality for editing and deleting recurring events
 */
export const useRecurringEventOperations = (
  events: Event[],
  updateEvents: (events: Event[]) => void
) => {
  const isRecurringEvent = (event: Event): boolean => {
    return event.repeat.type !== 'none' && event.repeat.interval > 0;
  };

  const isSameRecurringSeries = (eventA: Event, eventB: Event): boolean => {
    return (
      eventA.repeat.type === eventB.repeat.type &&
      eventA.repeat.interval === eventB.repeat.interval &&
      eventA.title === eventB.title &&
      eventA.startTime === eventB.startTime &&
      eventA.endTime === eventB.endTime &&
      eventA.description === eventB.description &&
      eventA.location === eventB.location &&
      eventA.category === eventB.category
    );
  };

  const findRelatedRecurringEvents = (targetEvent: Event): Event[] => {
    if (!isRecurringEvent(targetEvent)) {
      return [];
    }

    // Find ALL events that are part of the same recurring series
    const seriesEvents = events.filter(
      (event) => isRecurringEvent(event) && isSameRecurringSeries(event, targetEvent)
    );

    // If there's only one event in the series (just the target event itself), return empty array
    // If there are multiple events in the series, return all events including the target
    return seriesEvents.length > 1 ? seriesEvents : [];
  };

  /**
   * Generic API request handler with error handling
   */
  const makeApiRequest = async (url: string, method: string, body?: unknown): Promise<boolean> => {
    try {
      const config: RequestInit = { method };

      if (body !== undefined) {
        config.headers = { 'Content-Type': 'application/json' };
        config.body = JSON.stringify(body);
      }

      const response = await fetch(url, config);
      return response.ok;
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error);
      return false;
    }
  };

  const updateEventOnServer = async (event: Event): Promise<boolean> => {
    return makeApiRequest(`${API_ENDPOINTS.events}/${event.id}`, HTTP_METHODS.PUT, event);
  };

  const deleteEventOnServer = async (eventId: string): Promise<boolean> => {
    return makeApiRequest(`${API_ENDPOINTS.events}/${eventId}`, HTTP_METHODS.DELETE);
  };

  const deleteRecurringEventOnServer = async (repeatId: string): Promise<boolean> => {
    return makeApiRequest(`${API_ENDPOINTS.recurringEvents}/${repeatId}`, HTTP_METHODS.DELETE);
  };

  const updateRecurringEventOnServer = async (
    repeatId: string,
    updateData: Partial<Event>
  ): Promise<boolean> => {
    return makeApiRequest(
      `${API_ENDPOINTS.recurringEvents}/${repeatId}`,
      HTTP_METHODS.PUT,
      updateData
    );
  };

  const createSingleEditEvent = (updatedEvent: Event): Event => ({
    ...updatedEvent,
    repeat: DEFAULT_REPEAT_CONFIG,
  });

  /**
   * 날짜 차이(일수)를 계산합니다
   * @param fromDate - 원래 날짜 (YYYY-MM-DD)
   * @param toDate - 변경할 날짜 (YYYY-MM-DD)
   * @returns 날짜 차이 (일수)
   */
  const calculateDateOffset = (fromDate: string, toDate: string): number => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Prefers recurring API when repeatId is available, falls back to individual updates
   */
  const updateRecurringSeries = async (
    originalEvent: Event,
    updatedEvent: Event,
    relatedEvents: Event[],
    isDragAndDrop: boolean = false
  ): Promise<boolean> => {
    const repeatId = originalEvent.repeat.id;

    if (repeatId) {
      const updateData: Partial<Event & { dateOffset?: number }> = {
        title: updatedEvent.title,
        description: updatedEvent.description,
        location: updatedEvent.location,
        category: updatedEvent.category,
        notificationTime: updatedEvent.notificationTime,
      };

      // 드래그 앤 드롭인 경우: 날짜 오프셋 계산해서 전송
      if (isDragAndDrop) {
        const dateOffset = calculateDateOffset(originalEvent.date, updatedEvent.date);
        updateData.dateOffset = dateOffset;
      }

      return await updateRecurringEventOnServer(repeatId, updateData);
    } else {
      // repeat.id가 없을 때는 개별 이벤트 업데이트
      const dateOffset = isDragAndDrop
        ? calculateDateOffset(originalEvent.date, updatedEvent.date)
        : 0;

      const results = await Promise.all(
        relatedEvents.map((event) => {
          const eventUpdate: Event = { ...event };
          // 드래그 앤 드롭인 경우에만 date 포함 (오프셋만큼)
          if (isDragAndDrop && dateOffset !== 0) {
            const newDate = new Date(event.date);
            newDate.setDate(newDate.getDate() + dateOffset);
            const year = newDate.getFullYear();
            const month = String(newDate.getMonth() + 1).padStart(2, '0');
            const day = String(newDate.getDate()).padStart(2, '0');
            eventUpdate.date = `${year}-${month}-${day}`;
          }
          // 공통 필드 업데이트
          eventUpdate.title = updatedEvent.title;
          eventUpdate.description = updatedEvent.description;
          eventUpdate.location = updatedEvent.location;
          eventUpdate.category = updatedEvent.category;
          eventUpdate.notificationTime = updatedEvent.notificationTime;
          return updateEventOnServer(eventUpdate);
        })
      );
      return results.every((result) => result);
    }
  };

  /**
   * Handles editing of recurring events with user choice for scope
   * @param updatedEvent - The event with updated information
   * @param editSingleOnly - true for single event edit, false for series edit
   * @param isDragAndDrop - true if the edit is from drag and drop operation
   */
  const handleRecurringEdit = async (
    updatedEvent: Event,
    editSingleOnly: boolean,
    isDragAndDrop: boolean = false
  ): Promise<void> => {
    const originalEvent = events.find((e) => e.id === updatedEvent.id);

    if (!originalEvent) {
      await updateEventOnServer(updatedEvent);
      updateEvents([]);
      return;
    }

    const relatedEvents = findRelatedRecurringEvents(originalEvent);

    if (relatedEvents.length === 0 || editSingleOnly) {
      const singleEvent = createSingleEditEvent(updatedEvent);
      await updateEventOnServer(singleEvent);
      updateEvents([]);
      return;
    }

    await updateRecurringSeries(originalEvent, updatedEvent, relatedEvents, isDragAndDrop);
    updateEvents([]);
  };

  /**
   * Prefers recurring API when repeatId is available, falls back to individual deletion
   */
  const deleteRecurringSeries = async (
    eventToDelete: Event,
    relatedEvents: Event[]
  ): Promise<boolean> => {
    const repeatId = eventToDelete.repeat.id;

    if (repeatId) {
      return await deleteRecurringEventOnServer(repeatId);
    } else {
      const results = await Promise.all(
        relatedEvents.map((event) => deleteEventOnServer(event.id))
      );
      return results.every((result) => result);
    }
  };

  const executeDeleteAndRefresh = async (
    deleteOperation: () => Promise<boolean>
  ): Promise<void> => {
    await deleteOperation();
    updateEvents([]);
  };

  /**
   * Handles deletion of recurring events with user choice for scope
   * @param eventToDelete - The event to be deleted
   * @param deleteSingleOnly - true for single event deletion, false for series deletion
   */
  const handleRecurringDelete = async (
    eventToDelete: Event,
    deleteSingleOnly: boolean
  ): Promise<void> => {
    const relatedEvents = findRelatedRecurringEvents(eventToDelete);

    if (relatedEvents.length === 0) {
      await executeDeleteAndRefresh(() => deleteEventOnServer(eventToDelete.id));
      return;
    }

    if (deleteSingleOnly) {
      await executeDeleteAndRefresh(() => deleteEventOnServer(eventToDelete.id));
    } else {
      await executeDeleteAndRefresh(() => deleteRecurringSeries(eventToDelete, relatedEvents));
    }
  };

  return {
    handleRecurringEdit,
    handleRecurringDelete,
    findRelatedRecurringEvents,
  };
};
