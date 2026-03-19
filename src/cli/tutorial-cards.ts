/**
 * Tutorial card content for guided init flow.
 * Each card provides context and examples for a config option.
 */

export interface TutorialCard {
  title: string;
  explanation: string;
  examples?: string[];
}

export const TUTORIAL_CARDS: Record<string, TutorialCard> = {
  projectName: {
    title: 'Project Name',
    explanation: [
      'Identifies your project in AI context.',
      'Used in memories, stories, and generated docs.',
      'Auto-detected from package.json or folder name.',
    ].join('\n'),
  },
  language: {
    title: 'Communication Language',
    explanation: [
      'The language AI uses when talking to you.',
      'All prompts, explanations, and menus use this.',
    ].join('\n'),
    examples: [
      'English:    "Fixed the auth bug."',
      'Vietnamese: "Đã sửa lỗi xác thực."',
      'Japanese:   "認証バグを修正しました。"',
    ],
  },
  docLanguage: {
    title: 'Document Output Language',
    explanation: [
      'Language for generated documents (PRDs, stories).',
      'Can differ from communication language.',
      'e.g. Talk in Vietnamese, docs in English.',
    ].join('\n'),
  },
  style: {
    title: 'Response Style',
    explanation: 'How the AI communicates with you:',
    examples: [
      'technical: "Null ref in useAuth → added guard."',
      'casual:    "Hey! 🎉 Fixed that login bug!"',
      'formal:    "The issue has been resolved..."',
    ],
  },
  outputFolder: {
    title: 'Output Folder',
    explanation: [
      'Where generated artifacts are saved.',
      '',
      '  📂 _akit-output/',
      '  ├── planning-artifacts/    (PRDs, epics)',
      '  └── implementation-artifacts/ (stories)',
    ].join('\n'),
  },
};

/**
 * Render a tutorial card to the console using box-drawing characters.
 */
export const renderTutorialCard = (card: TutorialCard): void => {
  const WIDTH = 52;
  const pad = (s: string) => {
    const visible = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, 'XX');
    const padLen = Math.max(0, WIDTH - 4 - visible.length);
    return s + ' '.repeat(padLen);
  };

  console.log();
  console.log(`  ╭${'─'.repeat(WIDTH - 2)}╮`);
  console.log(`  │ 🎓 ${pad(card.title)}│`);
  console.log(`  ├${'─'.repeat(WIDTH - 2)}┤`);

  for (const line of card.explanation.split('\n')) {
    console.log(`  │  ${pad(line)}│`);
  }

  if (card.examples && card.examples.length > 0) {
    console.log(`  ├${'─'.repeat(WIDTH - 2)}┤`);
    for (const ex of card.examples) {
      console.log(`  │  ${pad(ex)}│`);
    }
  }

  console.log(`  ╰${'─'.repeat(WIDTH - 2)}╯`);
  console.log();
};
