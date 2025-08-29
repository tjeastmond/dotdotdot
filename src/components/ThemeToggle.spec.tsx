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
      theme: 'dark',
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
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByLabelText('Switch to light theme');

    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should toggle between light and dark themes', () => {
    const mockSetTheme = jest.fn();

    // Start with dark theme
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByLabelText('Switch to light theme');

    // First click: dark -> light
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
  });

  it('should show correct icon based on resolvedTheme', () => {
    // Test dark theme icon (resolvedTheme: dark)
    mockUseTheme.mockReturnValue({
      theme: 'system', // theme can be system but icon shows based on resolvedTheme
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument();

    // Test light theme icon (resolvedTheme: light)
    mockUseTheme.mockReturnValue({
      theme: 'system', // theme can be system but icon shows based on resolvedTheme
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument();
  });

  it('should have correct aria-label for accessibility', () => {
    // Dark theme - should offer to switch to light
    mockUseTheme.mockReturnValue({
      theme: 'dark',
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
  });

  it('should show correct title attribute', () => {
    // Dark theme
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByTitle('Current: dark (Click for light)');
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
  });
});
