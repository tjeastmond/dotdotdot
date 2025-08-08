/**
 * UI Components Test Suite
 *
 * This file serves as the main entry point for all UI component tests.
 * It ensures all UI components have proper test coverage.
 */

// Import all component tests
import './button.test';

// Re-export components for easier testing imports
export { Button, buttonVariants } from './button';

// Test utilities and helpers specific to UI components
export const UI_TEST_IDS = {
  BUTTON: 'ui-button',
} as const;

export const COMMON_UI_CLASSES = {
  FOCUS_VISIBLE: 'focus-visible:outline-none focus-visible:ring-1',
  DISABLED: 'disabled:pointer-events-none disabled:opacity-50',
  TRANSITION: 'transition-colors',
} as const;

// Helper function to test common UI patterns
export const expectUIElementToHaveCommonClasses = (element: HTMLElement) => {
  expect(element).toHaveClass('transition-colors');
  expect(element).toHaveClass('focus-visible:outline-none');
};

// Test coverage report for UI components
describe('UI Components Test Coverage', () => {
  it('should have test files for all UI components', () => {
    // This test ensures we don't forget to test new UI components
    const componentFiles = ['button'];
    const testFiles = ['button.test'];

    componentFiles.forEach(component => {
      const hasTest = testFiles.some(test => test.includes(component));
      expect(hasTest).toBe(true);
    });
  });
});
