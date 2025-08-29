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

  it('should show correct icon for current theme', () => {
    // Test dark theme icon
    mockUseTheme.mockReturnValue({
      theme: 'dark',
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
});
