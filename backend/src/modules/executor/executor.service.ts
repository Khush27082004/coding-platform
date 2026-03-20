import { exec } from 'child_process';
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

  async executeCode(language: Language, code: string, input: string = '') {
    const config = languageConfigs[language];
    if (!config) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const executionId = randomUUID();
    const fileName = `${executionId}${config.extension}`;
    const filePath = join(this.tempDir, fileName);

    try {
      await writeFile(filePath, code);

      const startTime = Date.now();
      
      let command: string;
      if (language === 'cpp') {
        const outputFile = join(this.tempDir, executionId);
        command = `g++ "${filePath}" -o "${outputFile}" && "${outputFile}"`;
      } else if (language === 'java') {
        command = `cd "${this.tempDir}" && javac "${fileName}" && java ${fileName.replace('.java', '')}`;
      } else {
        command = `${config.command} "${filePath}"`;
      }

      const { stdout, stderr } = await execAsync(command, {
        timeout: env.CODE_TIMEOUT,
        maxBuffer: 1024 * 1024,
        input: input,
      });

      const executionTime = Date.now() - startTime;

      return {
        output: stdout || stderr,
        error: stderr && !stdout ? stderr : null,
        executionTime,
        success: !stderr || stdout.length > 0,
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
        if (language === 'cpp') {
          await unlink(join(this.tempDir, executionId));
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
        dockerCommand = `docker run --rm --name ${containerName} --memory=${env.MAX_MEMORY}m --cpus=0.5 --network=none ${config.image} python -c "import base64; exec(base64.b64decode('${codeBase64}').decode())"`;
      } else if (language === 'javascript') {
        dockerCommand = `docker run --rm --name ${containerName} --memory=${env.MAX_MEMORY}m --cpus=0.5 --network=none ${config.image} node -e "eval(Buffer.from('${codeBase64}', 'base64').toString())"`;
      } else {
        return this.executeCode(language, code, input);
      }

      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(dockerCommand, {
        timeout: env.CODE_TIMEOUT,
        maxBuffer: 1024 * 1024,
      });
      const executionTime = Date.now() - startTime;

      return {
        output: stdout || stderr,
        error: stderr && !stdout ? stderr : null,
        executionTime,
        success: !stderr || stdout.length > 0,
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
