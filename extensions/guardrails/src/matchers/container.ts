import { CommandMatcher } from './command-matcher';
import type { ParsedCommand } from '../bash-parser';

export class ContainerMatcher extends CommandMatcher {
    match(cmd: ParsedCommand) {
        if (cmd.name !== 'docker' && cmd.name !== 'podman') return undefined;

        const subcommand = cmd.args[0];
        if (subcommand !== 'run' && subcommand !== 'create') return undefined;

        if (cmd.args.some((a) => a === '--privileged')) {
            return { description: 'container with privileged mode', pattern: 'docker --privileged' };
        }

        if (cmd.args.some((a) => a === '--pid=host')) {
            return { description: 'container with host PID namespace', pattern: 'docker --pid=host' };
        }

        if (cmd.args.some((a) => a === '--network=host')) {
            return { description: 'container with host network', pattern: 'docker --network=host' };
        }

        if (cmd.args.some((a) => a.includes('/var/run/docker.sock') || a.includes('/var/run/podman.sock'))) {
            return { description: 'container with docker socket', pattern: 'docker socket mount' };
        }

        return undefined;
    }
}
