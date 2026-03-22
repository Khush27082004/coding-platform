import { DockerService } from './docker.service';
import { Judge0Service } from './judge0.service';
import { getLanguageConfig, Language } from './languages.config';
import { env } from '../../config/env';

const dockerService = new DockerService();
const judge0Service = new Judge0Service();

export class ExecutorService {
  async executeCode(language: Language, code: string, input: string = '') {
    if (env.JUDGE0_ENABLED) {
      const config = getLanguageConfig(language);
      const result = await judge0Service.executeCode(config.judge0Id, code, input);
      return {
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        success: result.exitCode === 0 && !result.timedOut,
        status: result.timedOut ? 'timeout' : (result.exitCode === 0 ? 'success' : 'error')
      };
    }
    
    const result = await dockerService.executeCode(code, language, input);
    return {
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      success: result.exitCode === 0 && !result.timedOut,
      status: result.timedOut ? 'timeout' : (result.exitCode === 0 ? 'success' : 'error')
    };
  }

  async executeWithDocker(language: Language, code: string, input: string = '') {
    if (env.JUDGE0_ENABLED) {
      const config = getLanguageConfig(language);
      const result = await judge0Service.executeCode(config.judge0Id, code, input);
      return {
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        success: result.exitCode === 0 && !result.timedOut
      };
    }

    const result = await dockerService.executeCode(code, language, input);
    
    return {
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      success: result.exitCode === 0 && !result.timedOut
    };
  }
}
