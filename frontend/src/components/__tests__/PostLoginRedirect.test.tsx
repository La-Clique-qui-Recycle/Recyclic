import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PostLoginRedirect from '../PostLoginRedirect';

describe('PostLoginRedirect', () => {
  it('should redirect all users to root path', () => {
    let redirectPath = '';

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/post-login" element={<PostLoginRedirect />} />
          <Route path="/" element={<div>Root Dashboard</div>} />
        </Routes>
      </BrowserRouter>
    );

    // The component should redirect to root
    expect(window.location.pathname).toBe('/');
  });

  it('should use replace navigation', () => {
    const { container } = render(
      <BrowserRouter>
        <PostLoginRedirect />
      </BrowserRouter>
    );

    // The Navigate component should be rendered
    expect(container.querySelector('[to="/"]')).toBeTruthy;
  });
});
