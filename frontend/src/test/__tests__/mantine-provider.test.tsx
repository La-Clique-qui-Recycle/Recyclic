import { render, screen } from '../test-utils';
import { TestComponent } from '../test-utils';

describe('MantineProvider Test', () => {
  it('should render component with MantineProvider', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByTestId('test-component')).toHaveTextContent('Test Component');
  });
});
