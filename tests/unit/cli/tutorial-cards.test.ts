import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TUTORIAL_CARDS, renderTutorialCard } from '../../../src/cli/tutorial-cards.js';

describe('tutorial-cards', () => {
  describe('TUTORIAL_CARDS', () => {
    it('has all required card keys', () => {
      expect(TUTORIAL_CARDS).toHaveProperty('projectName');
      expect(TUTORIAL_CARDS).toHaveProperty('language');
      expect(TUTORIAL_CARDS).toHaveProperty('docLanguage');
      expect(TUTORIAL_CARDS).toHaveProperty('style');
      expect(TUTORIAL_CARDS).toHaveProperty('outputFolder');
    });

    it('each card has title and explanation', () => {
      for (const [key, card] of Object.entries(TUTORIAL_CARDS)) {
        expect(card.title, `${key} missing title`).toBeTruthy();
        expect(card.explanation, `${key} missing explanation`).toBeTruthy();
      }
    });

    it('language card has examples', () => {
      expect(TUTORIAL_CARDS.language.examples).toBeDefined();
      expect(TUTORIAL_CARDS.language.examples!.length).toBeGreaterThan(0);
    });

    it('style card has examples', () => {
      expect(TUTORIAL_CARDS.style.examples).toBeDefined();
      expect(TUTORIAL_CARDS.style.examples!.length).toBeGreaterThan(0);
    });
  });

  describe('renderTutorialCard', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('renders box-drawing characters', () => {
      renderTutorialCard(TUTORIAL_CARDS.projectName);
      const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('╭');
      expect(output).toContain('╰');
      expect(output).toContain('🎓');
    });

    it('renders card title', () => {
      renderTutorialCard(TUTORIAL_CARDS.language);
      const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('Communication Language');
    });

    it('renders examples when present', () => {
      renderTutorialCard(TUTORIAL_CARDS.style);
      const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('technical');
      expect(output).toContain('casual');
      expect(output).toContain('formal');
    });

    it('does not render example separator for cards without examples', () => {
      renderTutorialCard(TUTORIAL_CARDS.projectName);
      const calls = consoleSpy.mock.calls
        .map((c: unknown[]) => c[0])
        .filter((c): c is string => typeof c === 'string');
      const separators = calls.filter((c) => c.includes('├'));
      expect(separators.length).toBe(1);
    });
  });
});
