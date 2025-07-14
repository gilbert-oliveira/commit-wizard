import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/utils/args';

describe('Args Module', () => {
  describe('parseArgs', () => {
    it('should parse empty args correctly', () => {
      const args = parseArgs([]);

      expect(args.silent).toBe(false);
      expect(args.yes).toBe(false);
      expect(args.auto).toBe(false);
      expect(args.split).toBe(false);
      expect(args.dryRun).toBe(false);
      expect(args.help).toBe(false);
      expect(args.version).toBe(false);
    });

    it('should parse long flags correctly', () => {
      const args = parseArgs([
        '--silent',
        '--yes',
        '--auto',
        '--split',
        '--dry-run',
        '--help',
        '--version',
      ]);

      expect(args.silent).toBe(true);
      expect(args.yes).toBe(true);
      expect(args.auto).toBe(true);
      expect(args.split).toBe(true);
      expect(args.dryRun).toBe(true);
      expect(args.help).toBe(true);
      expect(args.version).toBe(true);
    });

    it('should parse short flags correctly', () => {
      const args = parseArgs(['-s', '-y', '-a', '-n', '-h', '-v']);

      expect(args.silent).toBe(true);
      expect(args.yes).toBe(true);
      expect(args.auto).toBe(true);
      expect(args.dryRun).toBe(true);
      expect(args.help).toBe(true);
      expect(args.version).toBe(true);
    });

    it('should parse mixed flags correctly', () => {
      const args = parseArgs(['--silent', '-y', '--split', '-n']);

      expect(args.silent).toBe(true);
      expect(args.yes).toBe(true);
      expect(args.auto).toBe(false);
      expect(args.split).toBe(true);
      expect(args.dryRun).toBe(true);
      expect(args.help).toBe(false);
      expect(args.version).toBe(false);
    });

    it('should ignore unknown flags', () => {
      const args = parseArgs(['--unknown', '-x', '--silent']);

      expect(args.silent).toBe(true);
      expect(args.yes).toBe(false);
      expect(args.auto).toBe(false);
      expect(args.split).toBe(false);
      expect(args.dryRun).toBe(false);
      expect(args.help).toBe(false);
      expect(args.version).toBe(false);
    });
  });
});
