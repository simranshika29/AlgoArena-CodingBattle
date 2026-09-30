import { Language } from '../api/types';

interface LanguageInfo {
  label: string;
  monaco: string;
  starter: string;
  hint?: string;
}

export const LANGUAGES: Record<Language, LanguageInfo> = {
  python: {
    label: 'Python 3',
    monaco: 'python',
    starter: `import sys


def main() -> None:
    lines = sys.stdin.read().splitlines()
    # Parse the input from \`lines\`, then print your answer.
    print(lines[0])


main()
`,
  },
  javascript: {
    label: 'JavaScript',
    monaco: 'javascript',
    starter: `const input = require('fs').readFileSync(0, 'utf8');
const lines = input.split('\\n');

// Parse the input from \`lines\`, then print your answer with console.log.
console.log(lines[0]);
`,
  },
  cpp: {
    label: 'C++',
    monaco: 'cpp',
    starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Read input with cin, then print your answer with cout.

    return 0;
}
`,
  },
  c: {
    label: 'C',
    monaco: 'c',
    starter: `#include <stdio.h>

int main(void) {
    // Read input with scanf, then print your answer with printf.

    return 0;
}
`,
  },
  java: {
    label: 'Java',
    monaco: 'java',
    hint: 'Your class must be named Main.',
    starter: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        // Read input with in.readLine(), then print your answer with System.out.println.
    }
}
`,
  },
};

export const LANGUAGE_ORDER: Language[] = ['python', 'javascript', 'cpp', 'c', 'java'];

export const sortLanguages = (languages: Language[]) =>
  LANGUAGE_ORDER.filter((language) => languages.includes(language));

const PREFERRED_KEY = 'algoarena.language';

export const getPreferredLanguage = (available: Language[]): Language => {
  try {
    const saved = localStorage.getItem(PREFERRED_KEY) as Language | null;
    if (saved && available.includes(saved)) return saved;
  } catch {
    // ignore unavailable storage
  }
  return sortLanguages(available)[0] ?? 'python';
};

export const setPreferredLanguage = (language: Language) => {
  try {
    localStorage.setItem(PREFERRED_KEY, language);
  } catch {
    // ignore unavailable storage
  }
};

/** Per-problem, per-language drafts kept in this browser only. */
const draftKey = (scope: string, language: Language) => `algoarena.draft.${scope}.${language}`;

export const loadDraft = (scope: string, language: Language): string => {
  try {
    return localStorage.getItem(draftKey(scope, language)) ?? LANGUAGES[language].starter;
  } catch {
    return LANGUAGES[language].starter;
  }
};

export const saveDraft = (scope: string, language: Language, code: string) => {
  try {
    if (code === LANGUAGES[language].starter) localStorage.removeItem(draftKey(scope, language));
    else localStorage.setItem(draftKey(scope, language), code);
  } catch {
    // ignore unavailable storage
  }
};
