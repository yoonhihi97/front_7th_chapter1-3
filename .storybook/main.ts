import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // 스토리 파일 위치
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  // 사용할 애드온
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],

  // 프레임워크 설정
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  // TypeScript 설정
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
