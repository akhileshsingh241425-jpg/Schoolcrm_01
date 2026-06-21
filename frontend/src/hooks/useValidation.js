import { useState, useCallback } from 'react';

const RULES = {
  required: (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')),
  email: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => v && !/^\d{7,15}$/.test(v.replace(/[+\-() ]/g, '')),
  pincode: (v) => v && !/^\d{6}$/.test(v),
  number: (v) => v && isNaN(Number(v)),
  minLength: (min) => (v) => v && v.length < min,
  maxLength: (max) => (v) => v && v.length > max,
  min: (min) => (v) => v !== '' && Number(v) < min,
  max: (max) => (v) => v !== '' && Number(v) > max,
};

const LABELS = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  password: 'Password',
  school_code: 'School Code',
  pincode: 'Pincode',
  first_name: 'First Name',
  last_name: 'Last Name',
};

export function useValidation(form, fieldRules) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const label = (field) => LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const validateField = useCallback((field, value) => {
    const rules = fieldRules[field];
    if (!rules) return '';
    for (const rule of rules) {
      if (typeof rule === 'object') {
        const [key, param] = Object.entries(rule)[0];
        const fn = RULES[key];
        if (fn && fn(param)(value)) {
          const msgs = {
            required: `${label(field)} is required`,
            email: 'Invalid email address',
            phone: 'Invalid phone number (7-15 digits)',
            pincode: 'Pincode must be 6 digits',
            number: 'Must be a number',
            minLength: `Must be at least ${param} characters`,
            maxLength: `Must be at most ${param} characters`,
            min: `Minimum value is ${param}`,
            max: `Maximum value is ${param}`,
          };
          return msgs[key] || `Invalid ${label(field)}`;
        }
      } else if (rule === 'required' && RULES.required(value)) {
        return `${label(field)} is required`;
      } else if (rule === 'email' && value && RULES.email(value)) {
        return 'Invalid email address';
      } else if (rule === 'phone' && value && RULES.phone(value)) {
        return 'Invalid phone number';
      } else if (rule === 'pincode' && value && RULES.pincode(value)) {
        return 'Pincode must be 6 digits';
      }
    }
    return '';
  }, [fieldRules]);

  const handleChange = useCallback((field, value, setter) => {
    if (setter) setter(value);
    if (touched[field] || errors[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  }, [validateField, touched, errors]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  }, [validateField, form]);

  const validate = useCallback(() => {
    const newErrors = {};
    for (const field of Object.keys(fieldRules)) {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    }
    setErrors(newErrors);
    setTouched(Object.keys(fieldRules).reduce((a, f) => ({ ...a, [f]: true }), {}));
    return Object.keys(newErrors).length === 0;
  }, [form, fieldRules, validateField]);

  const getProps = useCallback((field) => ({
    value: form[field] || '',
    error: !!errors[field],
    helperText: errors[field] || '',
    onBlur: () => handleBlur(field),
  }), [form, errors, handleBlur]);

  return { errors, touched, validate, handleChange, handleBlur, getProps, setErrors };
}
