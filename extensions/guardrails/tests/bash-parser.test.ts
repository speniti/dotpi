import { describe, it, expect, beforeAll } from 'vitest';
import { initBashParser, parseBash } from '../src/bash-parser';

describe('bash-parser (WASM)', () => {
    beforeAll(async () => {
        await initBashParser();
    });

    it('parses a simple command', () => {
        const result = parseBash('ls -la /tmp');
        expect(result).toEqual([{ name: 'ls', args: ['-la', '/tmp'], redirects: [] }]);
    });

    it('parses rm -rf', () => {
        const result = parseBash('rm -rf /tmp');
        expect(result).toEqual([{ name: 'rm', args: ['-rf', '/tmp'], redirects: [] }]);
    });

    it('parses sudo with subcommand', () => {
        const result = parseBash('sudo chmod -R 777 /var');
        expect(result).toEqual([{ name: 'sudo', args: ['chmod', '-R', '777', '/var'], redirects: [] }]);
    });

    it('parses a pipeline', () => {
        const result = parseBash('cat .env | grep SECRET');
        expect(result).toEqual([
            { name: 'cat', args: ['.env'], redirects: [] },
            { name: 'grep', args: ['SECRET'], redirects: [] },
        ]);
    });

    it('parses commands joined by &&', () => {
        const result = parseBash('rm -rf /tmp && sudo dd of=/dev/sda');
        expect(result).toEqual([
            { name: 'rm', args: ['-rf', '/tmp'], redirects: [] },
            { name: 'sudo', args: ['dd', 'of=/dev/sda'], redirects: [] },
        ]);
    });

    it('parses commands joined by ||', () => {
        const result = parseBash('echo ok || echo fail');
        expect(result).toEqual([
            { name: 'echo', args: ['ok'], redirects: [] },
            { name: 'echo', args: ['fail'], redirects: [] },
        ]);
    });

    it('parses commands joined by ;', () => {
        const result = parseBash('cd /tmp; ls');
        expect(result).toEqual([
            { name: 'cd', args: ['/tmp'], redirects: [] },
            { name: 'ls', args: [], redirects: [] },
        ]);
    });

    it('parses redirects', () => {
        const result = parseBash('echo hello > /tmp/out.txt');
        expect(result).not.toBeNull();
        expect(result!.length).toBeGreaterThanOrEqual(1);
        const last = result![result!.length - 1];
        expect(last.redirects).toEqual([{ op: '>', target: '/tmp/out.txt' }]);
    });

    it('parses quoted strings as single argument', () => {
        const result = parseBash("echo 'rm -rf /'");
        expect(result).toEqual([{ name: 'echo', args: ["'rm -rf /'"], redirects: [] }]);
    });

    it('parses git commit -m with quoted message', () => {
        const result = parseBash('git commit -m "use rm -rf safely"');
        expect(result).toEqual([{ name: 'git', args: ['commit', '-m', '"use rm -rf safely"'], redirects: [] }]);
    });

    it('parses docker run --privileged', () => {
        const result = parseBash('docker run --privileged ubuntu');
        expect(result).toEqual([{ name: 'docker', args: ['run', '--privileged', 'ubuntu'], redirects: [] }]);
    });

    it('parses variable assignment before command', () => {
        const result = parseBash('FOO=bar echo hello');
        // Variable assignments may or may not appear as a command
        expect(result).not.toBeNull();
    });

    it('returns null for empty input', () => {
        expect(parseBash('')).toBeNull();
    });

    it('returns null for whitespace-only input', () => {
        expect(parseBash('   ')).toBeNull();
    });
});
