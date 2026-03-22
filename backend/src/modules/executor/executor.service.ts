import { DockerService } from './docker.service';
import { Language } from './languages.config';

const dockerService = new DockerService();

export class ExecutorService {
  async executeCode(language: Language, code: string, input: string = '') {
    // Force local execution by disabling Docker path
    return dockerService.executeCode(code, language, input, 0);
  }

  async executeWithDocker(language: Language, code: string, input: string = '') {
    // This will check env.DOCKER_ENABLED internally and fallback to local if needed
    const result = await dockerService.executeCode(code, language, input);
    
    return {
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      success: result.exitCode === 0 && !result.timedOut
    };
  }
}
