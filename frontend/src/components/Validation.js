import React from 'react';
import { TextField, MenuItem } from '@mui/material';

const RULES = {
  required: (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === ''),
  email: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => v && !/^\d{7,15}$/.test(v.replace(/[+\-() ]/g, '')),
  pincode: (v) => v && !/^\d{6}$/.test(v),
  number: (v) => v !== '' && v !== null && v !== undefined && isNaN(Number(v)),
  minLength: (min) => (v) => v && v.length < min,
  maxLength: (max) => (v) => v && v.length > max,
  min: (min) => (v) => v !== '' && v !== null && Number(v) < min,
  max: (max) => (v) => v !== '' && v !== null && Number(v) > max,
};

const LABELS = {
  name: 'Name', email: 'Email', phone: 'Phone', password: 'Password',
  first_name: 'First Name', last_name: 'Last Name', pincode: 'Pincode',
  address: 'Address', city: 'City', state: 'State',
  school_code: 'School Code', role: 'Role',
};

function label(field) {
  return LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getMessages(rule, field) {
  const msgs = {
    required: `${label(field)} is required`,
    email: 'Invalid email address',
    phone: 'Invalid phone number (7-15 digits)',
    pincode: 'Pincode must be exactly 6 digits',
    number: 'Must be a number',
  };
  if (typeof rule === 'object') {
    const [key, param] = Object.entries(rule)[0];
    return msgs[key] || { minLength: `Min ${param} chars`, maxLength: `Max ${param} chars`, min: `Minimum: ${param}`, max: `Maximum: ${param}` }[key] || `Invalid`;
  }
  return msgs[rule] || `Invalid ${label(field)}`;
}

export function validateField(field, value, rules) {
  if (!rules) return '';
  for (const rule of rules) {
    if (rule === 'required' && RULES.required(value)) return getMessages('required', field);
    if (rule === 'email' && value && RULES.email(value)) return getMessages('email', field);
    if (rule === 'phone' && value && RULES.phone(value)) return getMessages('phone', field);
    if (rule === 'pincode' && value && RULES.pincode(value)) return getMessages('pincode', field);
    if (rule === 'number' && value && RULES.number(value)) return getMessages('number', field);
    if (typeof rule === 'object') {
      const [key, param] = Object.entries(rule)[0];
      const fn = RULES[key];
      if (fn && fn(param)(value)) return getMessages(rule, field);
    }
  }
  return '';
}

export function validateForm(form, fieldRules) {
  const errors = {};
  for (const field of Object.keys(fieldRules)) {
    const err = validateField(field, form[field], fieldRules[field]);
    if (err) errors[field] = err;
  }
  return errors;
}

export function VTextField({ field, rules, form, setForm, errors, ...props }) {
  const err = errors?.[field] || '';
  return (
    <TextField
      fullWidth
      label={props.label || label(field)}
      value={form?.[field] ?? ''}
      onChange={(e) => {
        let val = e.target.value;
        if (rules?.includes('phone') || rules?.includes('pincode')) val = val.replace(/\D/g, '');
        if (rules?.some(r => typeof r === 'object' && r.maxLength)) {
          const max = rules.find(r => typeof r === 'object')?.maxLength;
          if (max) val = val.slice(0, max);
        }
        if (setForm) setForm((prev) => ({ ...prev, [field]: val }));
      }}
      error={!!err}
      helperText={err}
      {...props}
    />
  );
}

export function VSelect({ field, rules, form, setForm, errors, options, ...props }) {
  const err = errors?.[field] || '';
  return (
    <TextField select fullWidth
      label={props.label || label(field)}
      value={form?.[field] ?? ''}
      onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
      error={!!err}
      helperText={err || props.helperText}
      {...props}
    >
      {!props.required && <MenuItem value=""><em>None</em></MenuItem>}
      {options.map((opt) => (
        <MenuItem key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </MenuItem>
      ))}
    </TextField>
  );
}
