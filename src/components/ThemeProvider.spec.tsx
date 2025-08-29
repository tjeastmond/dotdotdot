import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock document.documentElement with proper jest mocks
const mockRemove = jest.fn();
const mockAdd = jest.fn();
const mockSetAttribute = jest.fn();

Object.defineProperty(document, 'documentElement', {
  value: {
    className: '',
    classList: {
      remove: mockRemove,
      add: mockAdd,
    },
    setAttribute: mockSetAttribute,
  },
  writable: true,
});

// Test component to access theme context
function TestComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
    // Reset mocks
    mockRemove.mockClear();
    mockAdd.mockClear();
    mockSetAttribute.mockClear();
  });

  it('should use dark theme for first-time visitors', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should default to dark theme
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    // Resolved theme should be dark
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
  });

  it('should use saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('light');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
  });

  it('should update theme when setTheme is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const lightButton = screen.getByText('Set Light');
    act(() => {
      lightButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
  });

  it('should save theme to localStorage when user makes a choice', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const lightButton = screen.getByText('Set Light');
    act(() => {
      lightButton.click();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('should handle system theme correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const systemButton = screen.getByText('Set System');
    act(() => {
      systemButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    // Resolved theme should be dark (based on our mock)
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
  });

  it('should apply theme classes to document element', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Wait for effects to run
    act(() => {
      // Trigger a theme change
      const lightButton = screen.getByText('Set Light');
      lightButton.click();
    });

    // Check that theme classes are applied
    expect(mockRemove).toHaveBeenCalledWith('light', 'dark');
    expect(mockAdd).toHaveBeenCalledWith('light');
    expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'light');
  });

  it('should handle invalid saved themes gracefully', () => {
    // Mock localStorage to return an invalid theme
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'invalid-theme'),
        setItem: jest.fn(),
      },
      writable: true,
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should fallback to dark theme
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });
});
