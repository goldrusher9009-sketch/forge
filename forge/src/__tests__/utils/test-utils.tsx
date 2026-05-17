import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  withAuth?: boolean;
  withRouter?: boolean;
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { initialRoute = '/', withRouter = true, withAuth = true, ...renderOptions } = options || {};

  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  if (withRouter && withAuth) {
    return render(ui, { wrapper: AllTheProviders, ...renderOptions });
  }

  if (withRouter) {
    return render(ui, {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      ...renderOptions,
    });
  }

  if (withAuth) {
    return render(ui, {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      ...renderOptions,
    });
  }

  return render(ui, renderOptions);
};

export * from '@testing-library/react';
export { customRender as render };
