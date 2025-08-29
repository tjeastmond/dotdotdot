import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

// Mock the useTheme hook
const mockUseTheme = jest.fn();

jest.mock('./ThemeProvider', () => ({
  ...jest.requireActual('./ThemeProvider'),
  useTheme: () => mockUseTheme(),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });
  });

  it('should render theme toggle button', () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument();
  });

  it('should call setTheme when clicked', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByLabelText('Switch to light theme');

    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should cycle through themes correctly', () => {
    const mockSetTheme = jest.fn();

    // Start with system theme
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByLabelText('Switch to light theme');

    // First click: system -> light
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('light');

    // Reset mock for next test
    mockSetTheme.mockClear();

    // Second click: light -> dark
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    const button2 = screen.getByLabelText('Switch to dark theme');
    fireEvent.click(button2);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    // Reset mock for next test
    mockSetTheme.mockClear();

    // Third click: dark -> system
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button3 = screen.getByLabelText('Switch to system theme');
    fireEvent.click(button3);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('should show correct icon for current theme', () => {
    // Test system theme icon
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument();

    // Test light theme icon
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument();

    // Test dark theme icon
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to system theme')).toBeInTheDocument();
  });

  it('should have correct aria-label for accessibility', () => {
    // System theme - should offer to switch to light
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument();

    // Light theme - should offer to switch to dark
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument();

    // Dark theme - should offer to switch to system
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to system theme')).toBeInTheDocument();
  });

  it('should show correct title attribute', () => {
    // System theme
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByTitle('Current: System (Click for light)');
    expect(button).toBeInTheDocument();

    // Light theme
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    const button2 = screen.getByTitle('Current: light (Click for dark)');
    expect(button2).toBeInTheDocument();

    // Dark theme
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button3 = screen.getByTitle('Current: dark (Click for system)');
    expect(button3).toBeInTheDocument();
  });
});
