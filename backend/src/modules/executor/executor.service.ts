import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { languageConfigs, Language } from './languages.config';
import { env } from '../../config/env';

const execAsync = promisify(exec);

export class ExecutorService {
  private tempDir = join(process.cwd(), 'temp');

  constructor() {
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Directory exists
    }
  }

  private runCommandWithInput(command: string, input: string = ''): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        shell: true,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          child.kill();
          reject(new Error('Execution timeout'));
        }
      }, env.CODE_TIMEOUT);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(error);
        }
      });

      child.on('close', (code) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve({ stdout, stderr, code });
        }
      });

      if (input && child.stdin.writable) {
        child.stdin.write(input);
      }
      if (child.stdin.writable) {
        child.stdin.end();
      }
    });
  }

  async executeCode(language: Language, code: string, input: string = '') {
    const config = languageConfigs[language];
    if (!config) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const executionId = randomUUID();
    const fileName = language === 'java' ? 'Solution.java' : `${executionId}${config.extension}`;
    const filePath = join(this.tempDir, fileName);

    try {
      await writeFile(filePath, code);

      const startTime = Date.now();
      
      let command: string;
      if (language === 'cpp' || language === 'c') {
        const outputFile = join(this.tempDir, executionId);
        const compiler = language === 'cpp' ? 'g++' : 'gcc';
        command = `${compiler} "${filePath}" -o "${outputFile}" && "${outputFile}"`;
      } else if (language === 'java') {
        command = `cd "${this.tempDir}" && javac "Solution.java" && java Solution`;
      } else {
        command = `${config.command} "${filePath}"`;
      }

      const { stdout, stderr, code: exitCode } = await this.runCommandWithInput(command, input);

      const executionTime = Date.now() - startTime;

      return {
        output: stdout || stderr,
        error: exitCode && exitCode !== 0 ? stderr || 'Execution failed' : null,
        executionTime,
        success: exitCode === 0,
      };
    } catch (error: any) {
      return {
        output: '',
        error: error.message || 'Execution failed',
        executionTime: 0,
        success: false,
      };
    } finally {
      try {
        await unlink(filePath);
        if (language === 'cpp' || language === 'c') {
          await unlink(join(this.tempDir, executionId));
        } else if (language === 'java') {
          await unlink(join(this.tempDir, 'Solution.class'));
        }
      } catch (error) {
        // Cleanup failed, ignore
      }
    }
  }

  async executeWithDocker(language: Language, code: string, input: string = '') {
    if (!env.DOCKER_ENABLED) {
      return this.executeCode(language, code, input);
    }

    const config = languageConfigs[language];
    const executionId = randomUUID();
    const containerName = `code-exec-${executionId}`;

    try {
      const codeBase64 = Buffer.from(code).toString('base64');
      const inputBase64 = Buffer.from(input).toString('base64');

      let dockerCommand: string;
      if (language === 'python') {
        dockerCommand = `docker run -i --rm --name ${containerName} --memory=${env.MAX_MEMORY}m --cpus=0.5 --network=none ${config.image} python -c "import base64; exec(base64.b64decode('${codeBase64}').decode())"`;
      } else if (language === 'javascript') {
        dockerCommand = `docker run -i --rm --name ${containerName} --memory=${env.MAX_MEMORY}m --cpus=0.5 --network=none ${config.image} node -e "eval(Buffer.from('${codeBase64}', 'base64').toString())"`;
      } else {
        return this.executeCode(language, code, input);
      }

      const startTime = Date.now();
      const { stdout, stderr, code: exitCode } = await this.runCommandWithInput(dockerCommand, inputBase64 ? input : '');
      const executionTime = Date.now() - startTime;

      return {
        output: stdout || stderr,
        error: exitCode && exitCode !== 0 ? stderr || 'Execution failed' : null,
        executionTime,
        success: exitCode === 0,
      };
    } catch (error: any) {
      try {
        await execAsync(`docker rm -f ${containerName}`);
      } catch (e) {
        // Container cleanup failed
      }

      return {
        output: '',
        error: error.killed ? 'Execution timeout' : error.message,
        executionTime: 0,
        success: false,
      };
    }
  }
}
