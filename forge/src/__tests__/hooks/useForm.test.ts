import { renderHook, act } from '@testing-library/react';
import { useForm } from '@/hooks/useForm';

describe('useForm Hook', () => {
  const initialValues = {
    email: '',
    password: '',
  };

  const validate = (values: typeof initialValues) => {
    const errors: Record<string, string> = {};
    if (!values.email) errors.email = 'Email is required';
    if (!values.password) errors.password = 'Password is required';
    return errors;
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should update field value', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate })
    );

    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should validate and set errors', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate })
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.errors.email).toBe('Email is required');
  });

  it('should reset form to initial values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate })
    );

    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
  });

  it('should track touched fields', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate })
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.touched.email).toBe(true);
  });

  it('should validate entire form', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate })
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(result.current.errors).toHaveProperty('email');
    expect(result.current.errors).toHaveProperty('password');
  });

  it('should return true for valid form', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validate })
    );

    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
      result.current.setFieldValue('password', 'password123');
    });

    const isValid = result.current.validateForm();

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });
});
