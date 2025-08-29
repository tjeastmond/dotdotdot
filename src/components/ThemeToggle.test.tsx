import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from './ThemeProvider';

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
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
  });

  it('should show dropdown when clicked', () => {
    render(<ThemeToggle />);
    const button = screen.getByLabelText('Toggle theme');
    
    fireEvent.click(button);
    
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('should not show system option', () => {
    render(<ThemeToggle />);
    const button = screen.getByLabelText('Toggle theme');
    
    fireEvent.click(button);
    
    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });

  it('should call setTheme when theme option is clicked', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    render(<ThemeToggle />);
    const button = screen.getByLabelText('Toggle theme');
    
    fireEvent.click(button);
    fireEvent.click(screen.getByText('Light'));
    
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should close dropdown when backdrop is clicked', () => {
    render(<ThemeToggle />);
    const button = screen.getByLabelText('Toggle theme');
    
    fireEvent.click(button);
    expect(screen.getByText('Light')).toBeInTheDocument();
    
    // Click backdrop (first div with fixed inset-0)
    const backdrop = document.querySelector('div[class*="fixed inset-0"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    expect(screen.queryByText('Light')).not.toBeInTheDocument();
  });

  it('should show current theme icon', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    });

    render(<ThemeToggle />);
    const button = screen.getByLabelText('Toggle theme');
    
    // Should show sun icon for light theme
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
