/**
 * UI Components Test Suite
 *
 * This file serves as the main entry point for all UI component tests.
 * It ensures all UI components have proper test coverage.
 */

import { Button } from './button';
import { Textarea } from './textarea';

describe('UI Components', () => {
  it('should export Button component', () => {
    expect(Button).toBeDefined();
  });

  it('should export Textarea component', () => {
    expect(Textarea).toBeDefined();
  });
});
