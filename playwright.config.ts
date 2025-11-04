import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정 파일
 * 참고: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 파일 위치
  testDir: './src/__tests__/e2e',

  // 각 테스트의 최대 실행 시간 (30초)
  timeout: 30 * 1000,

  // 테스트 실패 시 재시도 횟수
  fullyParallel: false, // 순차 실행 (데이터 격리)
  retries: process.env.CI ? 2 : 0, // CI 환경에서만 재시도

  // 병렬 실행 워커 수
  workers: 1, // 단일 워커로 순차 실행

  // 리포터 설정 (테스트 결과 표시 방법)
  reporter: 'html',

  use: {
    // 기본 URL (테스트에서 상대 경로 사용 가능)
    baseURL: 'http://localhost:5173',

    // 테스트 실패 시 스크린샷 찍기
    screenshot: 'only-on-failure',

    // 테스트 실행 기록 (디버깅용)
    trace: 'on-first-retry',

    // 비디오 녹화
    video: 'retain-on-failure',
  },

  // 테스트할 브라우저 설정
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'TEST_ENV=e2e pnpm dev', // 백엔드와 프론트엔드를 동시에 시작
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI, // 로컬에서는 재사용, CI에서만 새로 시작
    timeout: 120 * 1000, // 서버 시작 대기 시간 (2분)
  },
});
