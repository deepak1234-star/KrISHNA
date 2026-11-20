import { describe, it, expect } from 'vitest';
import { TypingEngine } from '../engine/typingEngine.js';

describe('TypingEngine', () => {
  it('correctly compares typed characters against passage', () => {
    const passage = "The public administration";
    const engine = new TypingEngine({ passage });

    // Type "The " correctly
    engine.handleKeyDown({ key: 'T' });
    engine.handleKeyDown({ key: 'h' });
    engine.handleKeyDown({ key: 'e' });
    engine.handleKeyDown({ key: ' ' });

    expect(engine.typed).toBe("The ");
    expect(engine.getCharacterStatus(0)).toBe('correct');
    expect(engine.getCharacterStatus(1)).toBe('correct');
    expect(engine.getCharacterStatus(2)).toBe('correct');
    expect(engine.getCharacterStatus(3)).toBe('correct');
    expect(engine.getCharacterStatus(4)).toBe('current');
    expect(engine.getCharacterStatus(5)).toBe('untyped');
  });

  it('marks incorrect characters red/incorrect and tracks mistakes', () => {
    const passage = "public";
    const engine = new TypingEngine({ passage });

    // User types 'p' (correct), then 'o' (mistake, expected 'u')
    engine.handleKeyDown({ key: 'p' });
    engine.handleKeyDown({ key: 'o' });

    expect(engine.getCharacterStatus(0)).toBe('correct');
    expect(engine.getCharacterStatus(1)).toBe('incorrect');
    expect(engine.mistakes.length).toBe(1);
    expect(engine.mistakes[0].expectedChar).toBe('u');
    expect(engine.mistakes[0].typedChar).toBe('o');
    expect(engine.mistakes[0].position).toBe(1);
  });

  it('handles backspace correctly and counts key depressions', () => {
    const passage = "system";
    const engine = new TypingEngine({ passage });

    engine.handleKeyDown({ key: 's' }); // key depression 1
    engine.handleKeyDown({ key: 'y' }); // key depression 2
    engine.handleKeyDown({ key: 'x' }); // key depression 3 (incorrect)

    expect(engine.typed).toBe("syx");
    expect(engine.totalKeyDepressions).toBe(3);
    expect(engine.getCharacterStatus(2)).toBe('incorrect');

    // User presses Backspace
    const res = engine.handleKeyDown({ key: 'Backspace' }); // key depression 4
    expect(res.handled).toBe(true);
    expect(engine.typed).toBe("sy");
    expect(engine.totalKeyDepressions).toBe(4);
    expect(engine.getCharacterStatus(2)).toBe('current');

    // Now types 's' (correct)
    engine.handleKeyDown({ key: 's' }); // key depression 5
    expect(engine.typed).toBe("sys");
    expect(engine.totalKeyDepressions).toBe(5);
    expect(engine.getCharacterStatus(2)).toBe('correct');
  });

  it('ignores modifier keys and shortcuts', () => {
    const passage = "data";
    const engine = new TypingEngine({ passage });

    engine.handleKeyDown({ key: 'Shift' });
    engine.handleKeyDown({ key: 'Control' });
    engine.handleKeyDown({ key: 'c', ctrlKey: true });
    engine.handleKeyDown({ key: 'Tab' });

    expect(engine.typed).toBe("");
    expect(engine.totalKeyDepressions).toBe(0);
  });

  it('calculates metrics properly', () => {
    const passage = "The government of India";
    const engine = new TypingEngine({ passage });

    // Type "The " (4 chars correct) in 12 seconds
    engine.handleKeyDown({ key: 'T' });
    engine.handleKeyDown({ key: 'h' });
    engine.handleKeyDown({ key: 'e' });
    engine.handleKeyDown({ key: ' ' });

    // Elapsed 12 seconds = 0.2 minutes
    // Words = 4 / 5 = 0.8
    // WPM = 0.8 / 0.2 = 4 WPM
    const metrics = engine.getMetrics(12);
    expect(metrics.correctCharacters).toBe(4);
    expect(metrics.totalKeyDepressions).toBe(4);
    expect(metrics.wpm).toBe(4);
    expect(metrics.errorPercentage).toBe(0);
  });
});
