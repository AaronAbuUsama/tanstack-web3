import type { Preview } from '@storybook/react-vite'
import '../src/styles.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'canvas',
      values: [
        { name: 'canvas', value: 'var(--ds-color-bg-canvas)' },
        { name: 'surface', value: 'var(--ds-color-bg-surface)' },
      ],
    },
  },
}

export default preview
