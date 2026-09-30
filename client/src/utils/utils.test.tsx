import React from 'react';
import { render, screen } from '@testing-library/react';
import RichText from '../components/RichText';
import { formatClock, pluralize } from './format';
import { getPreferredLanguage, LANGUAGES, loadDraft, saveDraft, sortLanguages } from './languages';

describe('RichText', () => {
  it('renders inline code and bold without interpreting HTML', () => {
    const { container } = render(<RichText text={'Print `a + b` for **each** line.\n\n<img src=x onerror=alert(1)>'} />);
    expect(screen.getByText('a + b').tagName).toBe('CODE');
    expect(screen.getByText('each').tagName).toBe('STRONG');
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});

describe('format', () => {
  it('formats clocks and plurals', () => {
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(3_600_000)).toBe('1:00:00');
    expect(formatClock(-5)).toBe('0:00');
    expect(pluralize(1, 'test')).toBe('1 test');
    expect(pluralize(3, 'test')).toBe('3 tests');
  });
});

describe('languages', () => {
  beforeEach(() => localStorage.clear());

  it('orders languages and falls back to the first available', () => {
    expect(sortLanguages(['java', 'python', 'c'])).toEqual(['python', 'c', 'java']);
    expect(getPreferredLanguage(['java', 'cpp'])).toBe('cpp');
  });

  it('stores drafts per problem and language', () => {
    expect(loadDraft('p1', 'python')).toBe(LANGUAGES.python.starter);
    saveDraft('p1', 'python', 'print(42)');
    expect(loadDraft('p1', 'python')).toBe('print(42)');
    expect(loadDraft('p2', 'python')).toBe(LANGUAGES.python.starter);
  });
});
