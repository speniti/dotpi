import { describe, it, expect } from 'vitest';
import { RmMatcher } from '../src/matchers/rm';
import { SudoMatcher } from '../src/matchers/sudo';
import { ChmodMatcher } from '../src/matchers/chmod';
import { ChownMatcher } from '../src/matchers/chown';
import { DdMatcher } from '../src/matchers/dd';
import { MkfsMatcher } from '../src/matchers/mkfs';
import { ContainerMatcher } from '../src/matchers/container';
import { matchDangerous } from '../src/matchers';
import type { ParsedCommand } from '../src/bash-parser';

function cmd(name: string, args: string[] = []): ParsedCommand {
    return { name, args, redirects: [] };
}

describe('CommandMatcher (base class)', () => {
    it('hasFlag detects single short flag', () => {
        const m = new RmMatcher();

        expect(m['hasFlag'](['-f'], 'f')).toBe(true);
        expect(m['hasFlag'](['-f'], 'r')).toBe(false);
    });

    it('hasFlag detects grouped short flags (-rf contains r and f)', () => {
        const m = new RmMatcher();

        expect(m['hasFlag'](['-rf'], 'r')).toBe(true);
        expect(m['hasFlag'](['-rf'], 'f')).toBe(true);
    });

    it('hasFlag ignores long options', () => {
        const m = new RmMatcher();

        expect(m['hasFlag'](['--force'], 'f')).toBe(false);
    });

    it('hasLongOption detects exact match', () => {
        const m = new RmMatcher();

        expect(m['hasLongOption'](['--recursive'], 'recursive')).toBe(true);
        expect(m['hasLongOption'](['--force'], 'recursive')).toBe(false);
    });

    it('hasLongOption detects option with value', () => {
        const m = new RmMatcher();

        expect(m['hasLongOption'](['--option=value'], 'option')).toBe(true);
    });

    it('hasArg detects prefix match', () => {
        const m = new RmMatcher();

        expect(m['hasArg'](['of=/dev/sda'], 'of=')).toBe(true);
        expect(m['hasArg'](['if=/dev/zero'], 'of=')).toBe(false);
    });
});

describe('RmMatcher', () => {
    const matcher = new RmMatcher();

    it('detects rm -rf', () => {
        expect(matcher.match(cmd('rm', ['-rf', '/tmp']))).toEqual({
            description: 'recursive force delete',
            pattern: 'rm -rf',
        });
    });

    it('detects rm -r -f as separate flags', () => {
        expect(matcher.match(cmd('rm', ['-r', '-f', '/tmp']))).toEqual({
            description: 'recursive force delete',
            pattern: 'rm -rf',
        });
    });

    it('detects rm --recursive --force', () => {
        expect(matcher.match(cmd('rm', ['--recursive', '--force', '/tmp']))).toEqual({
            description: 'recursive force delete',
            pattern: 'rm -rf',
        });
    });

    it('detects rm -r without force', () => {
        expect(matcher.match(cmd('rm', ['-r', '/tmp']))).toEqual({
            description: 'recursive delete',
            pattern: 'rm -r',
        });
    });

    it('ignores rm without recursive flag', () => {
        expect(matcher.match(cmd('rm', ['file.txt']))).toBeUndefined();
    });

    it('ignores non-rm commands', () => {
        expect(matcher.match(cmd('ls', ['-la']))).toBeUndefined();
    });

    it('detects rm -R (uppercase)', () => {
        expect(matcher.match(cmd('rm', ['-R', '-f', '/tmp']))).toEqual({
            description: 'recursive force delete',
            pattern: 'rm -rf',
        });
    });

    it('detects rm --dir --force', () => {
        expect(matcher.match(cmd('rm', ['--dir', '--force', '/tmp']))).toEqual({
            description: 'recursive force delete',
            pattern: 'rm -rf',
        });
    });
});

describe('SudoMatcher', () => {
    const matcher = new SudoMatcher();

    it('detects sudo', () => {
        expect(matcher.match(cmd('sudo', ['rm', '-rf', '/']))).toEqual({
            description: 'superuser command',
            pattern: 'sudo',
        });
    });

    it('ignores non-sudo commands', () => {
        expect(matcher.match(cmd('apt', ['install', 'something']))).toBeUndefined();
    });
});

describe('ChmodMatcher', () => {
    const matcher = new ChmodMatcher();

    it('detects chmod -R 777', () => {
        expect(matcher.match(cmd('chmod', ['-R', '777', '/var']))).toEqual({
            description: 'insecure recursive permissions',
            pattern: 'chmod -R 777',
        });
    });

    it('detects chmod --recursive 0777', () => {
        expect(matcher.match(cmd('chmod', ['--recursive', '0777', '/var']))).toEqual({
            description: 'insecure recursive permissions',
            pattern: 'chmod -R 777',
        });
    });

    it('detects chmod -R a+rwx', () => {
        expect(matcher.match(cmd('chmod', ['-R', 'a+rwx', '/var']))).toEqual({
            description: 'insecure recursive permissions',
            pattern: 'chmod -R 777',
        });
    });

    it('detects chmod -R 7777', () => {
        expect(matcher.match(cmd('chmod', ['-R', '7777', '/var']))).toEqual({
            description: 'insecure recursive permissions',
            pattern: 'chmod -R 777',
        });
    });

    it('ignores chmod without -R', () => {
        expect(matcher.match(cmd('chmod', ['777', '/var']))).toBeUndefined();
    });

    it('ignores chmod -R 755', () => {
        expect(matcher.match(cmd('chmod', ['-R', '755', '/var']))).toBeUndefined();
    });

    it('ignores non-chmod commands', () => {
        expect(matcher.match(cmd('chown', ['-R', 'root:root', '/var']))).toBeUndefined();
    });
});

describe('ChownMatcher', () => {
    const matcher = new ChownMatcher();

    it('detects chown -R', () => {
        expect(matcher.match(cmd('chown', ['-R', 'root:root', '/opt']))).toEqual({
            description: 'recursive ownership change',
            pattern: 'chown -R',
        });
    });

    it('detects chown --recursive', () => {
        expect(matcher.match(cmd('chown', ['--recursive', 'root:root', '/opt']))).toEqual({
            description: 'recursive ownership change',
            pattern: 'chown -R',
        });
    });

    it('ignores chown without -R', () => {
        expect(matcher.match(cmd('chown', ['root:root', '/opt']))).toBeUndefined();
    });

    it('ignores non-chown commands', () => {
        expect(matcher.match(cmd('chmod', ['-R', '777', '/var']))).toBeUndefined();
    });
});

describe('DdMatcher', () => {
    const matcher = new DdMatcher();

    it('detects dd of=', () => {
        expect(matcher.match(cmd('dd', ['of=/dev/sda', 'bs=1M']))).toEqual({
            description: 'disk write operation',
            pattern: 'dd of=',
        });
    });

    it('ignores dd without of=', () => {
        expect(matcher.match(cmd('dd', ['if=/dev/zero', 'bs=1M']))).toBeUndefined();
    });

    it('ignores non-dd commands', () => {
        expect(matcher.match(cmd('cp', ['file1', 'file2']))).toBeUndefined();
    });
});

describe('MkfsMatcher', () => {
    const matcher = new MkfsMatcher();

    it('detects mkfs', () => {
        expect(matcher.match(cmd('mkfs', ['/dev/sda1']))).toEqual({
            description: 'filesystem format',
            pattern: 'mkfs',
        });
    });

    it('detects mkfs.ext4', () => {
        expect(matcher.match(cmd('mkfs.ext4', ['/dev/sda1']))).toEqual({
            description: 'filesystem format',
            pattern: 'mkfs',
        });
    });

    it('detects mkfs.vfat', () => {
        expect(matcher.match(cmd('mkfs.vfat', ['-F', '32', '/dev/sda1']))).toEqual({
            description: 'filesystem format',
            pattern: 'mkfs',
        });
    });

    it('ignores non-mkfs commands', () => {
        expect(matcher.match(cmd('mount', ['/dev/sda1', '/mnt']))).toBeUndefined();
    });
});

describe('ContainerMatcher', () => {
    const matcher = new ContainerMatcher();

    it('detects docker run --privileged', () => {
        expect(matcher.match(cmd('docker', ['run', '--privileged', 'ubuntu']))).toEqual({
            description: 'container with privileged mode',
            pattern: 'docker --privileged',
        });
    });

    it('detects docker run --pid=host', () => {
        expect(matcher.match(cmd('docker', ['run', '--pid=host', 'ubuntu']))).toEqual({
            description: 'container with host PID namespace',
            pattern: 'docker --pid=host',
        });
    });

    it('detects docker run --network=host', () => {
        expect(matcher.match(cmd('docker', ['run', '--network=host', 'ubuntu']))).toEqual({
            description: 'container with host network',
            pattern: 'docker --network=host',
        });
    });

    it('detects docker socket mount', () => {
        expect(
            matcher.match(cmd('docker', ['run', '-v', '/var/run/docker.sock:/var/run/docker.sock', 'ubuntu'])),
        ).toEqual({
            description: 'container with docker socket',
            pattern: 'docker socket mount',
        });
    });

    it('detects podman run --privileged', () => {
        expect(matcher.match(cmd('podman', ['run', '--privileged', 'ubuntu']))).toEqual({
            description: 'container with privileged mode',
            pattern: 'docker --privileged',
        });
    });

    it('detects docker create --privileged', () => {
        expect(matcher.match(cmd('docker', ['create', '--privileged', 'ubuntu']))).toEqual({
            description: 'container with privileged mode',
            pattern: 'docker --privileged',
        });
    });

    it('ignores docker run without dangerous flags', () => {
        expect(matcher.match(cmd('docker', ['run', 'ubuntu']))).toBeUndefined();
    });

    it('ignores docker build', () => {
        expect(matcher.match(cmd('docker', ['build', '-t', 'myimage', '.']))).toBeUndefined();
    });

    it('ignores docker pull', () => {
        expect(matcher.match(cmd('docker', ['pull', 'ubuntu']))).toBeUndefined();
    });

    it('ignores non-container commands', () => {
        expect(matcher.match(cmd('ls', ['-la']))).toBeUndefined();
    });
});

describe('matchDangerous (registry)', () => {
    it('finds danger in first command', () => {
        const result = matchDangerous(cmd('sudo', ['rm', '-rf', '/']));
        expect(result).toEqual({
            description: 'superuser command',
            pattern: 'sudo',
        });
    });

    it('returns undefined for safe commands', () => {
        expect(matchDangerous(cmd('git', ['status']))).toBeUndefined();
        expect(matchDangerous(cmd('npm', ['install']))).toBeUndefined();
        expect(matchDangerous(cmd('node', ['server.js']))).toBeUndefined();
    });
});
