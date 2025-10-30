import crypto from 'crypto';
import { redisClient } from '../utils/redis';
import config from '../config';
import logger from '../utils/logger';

export interface CompletionRequest {
  code: string;
  language: string;
  cursorPosition: { line: number; column: number };
  context?: string;
}

export interface AnalysisRequest {
  code: string;
  language: string;
}

export interface OptimizationRequest {
  code: string;
  language: string;
}

export interface Suggestion {
  text: string;
  confidence: number;
  range?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface AnalysisResult {
  errors: Array<{
    message: string;
    severity: 'error' | 'warning' | 'info';
    line: number;
    column: number;
  }>;
  suggestions: string[];
}

export interface OptimizationResult {
  optimizations: Array<{
    title: string;
    description: string;
    code: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export class AISuggestionService {
  /**
   * Generate code completion suggestions
   */
  async getCompletion(request: CompletionRequest, userId: string): Promise<Suggestion[]> {
    try {
      // Check cache
      const cacheKey = this.getCacheKey('completion', request);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Returning cached completion');
        return cached;
      }

      // For demo purposes, return pattern-based suggestions
      // In production, this would call an AI model
      const suggestions = await this.generateCompletionSuggestions(request);

      // Cache result
      await this.saveToCache(cacheKey, suggestions);

      logger.info(`Generated ${suggestions.length} completions for user ${userId}`);
      return suggestions;
    } catch (error) {
      logger.error('Failed to get completion:', error);
      throw error;
    }
  }

  /**
   * Analyze code for errors and improvements
   */
  async analyzeCode(request: AnalysisRequest, userId: string): Promise<AnalysisResult> {
    try {
      const cacheKey = this.getCacheKey('analysis', request);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Returning cached analysis');
        return cached;
      }

      const analysis = await this.performCodeAnalysis(request);

      await this.saveToCache(cacheKey, analysis);

      logger.info(`Analyzed code for user ${userId}`);
      return analysis;
    } catch (error) {
      logger.error('Failed to analyze code:', error);
      throw error;
    }
  }

  /**
   * Generate optimization suggestions
   */
  async getOptimizations(request: OptimizationRequest, userId: string): Promise<OptimizationResult> {
    try {
      const cacheKey = this.getCacheKey('optimization', request);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Returning cached optimizations');
        return cached;
      }

      const optimizations = await this.generateOptimizations(request);

      await this.saveToCache(cacheKey, optimizations);

      logger.info(`Generated optimizations for user ${userId}`);
      return optimizations;
    } catch (error) {
      logger.error('Failed to get optimizations:', error);
      throw error;
    }
  }

  /**
   * Generate completion suggestions (pattern-based for demo)
   */
  private async generateCompletionSuggestions(request: CompletionRequest): Promise<Suggestion[]> {
    const { code, language } = request;
    const suggestions: Suggestion[] = [];

    // Solana/Rust specific patterns
    if (language === 'rust') {
      if (code.includes('pub fn')) {
        suggestions.push({
          text: 'pub fn process_instruction(\n    program_id: &Pubkey,\n    accounts: &[AccountInfo],\n    instruction_data: &[u8],\n) -> ProgramResult {\n    Ok(())\n}',
          confidence: 0.9,
        });
      }

      if (code.includes('use anchor_lang')) {
        suggestions.push({
          text: '#[program]\npub mod my_program {\n    use super::*;\n    \n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}',
          confidence: 0.85,
        });
      }

      if (code.includes('Account')) {
        suggestions.push({
          text: '#[account]\npub struct MyAccount {\n    pub data: u64,\n    pub authority: Pubkey,\n}',
          confidence: 0.8,
        });
      }
    }

    // JavaScript/TypeScript patterns
    if (language === 'typescript' || language === 'javascript') {
      if (code.includes('Connection')) {
        suggestions.push({
          text: 'const connection = new Connection(clusterApiUrl("devnet"));',
          confidence: 0.85,
        });
      }

      if (code.includes('async function')) {
        suggestions.push({
          text: 'async function sendTransaction() {\n    const transaction = new Transaction();\n    // Add instructions\n    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);\n    return signature;\n}',
          confidence: 0.8,
        });
      }
    }

    return suggestions.slice(0, 5); // Return top 5
  }

  /**
   * Perform code analysis (pattern-based for demo)
   */
  private async performCodeAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const { code, language } = request;
    const errors: AnalysisResult['errors'] = [];
    const suggestions: string[] = [];

    // Rust/Solana specific checks
    if (language === 'rust') {
      if (code.includes('unwrap()')) {
        errors.push({
          message: 'Avoid using unwrap() in production code. Use proper error handling with ? or match.',
          severity: 'warning',
          line: code.split('\n').findIndex(l => l.includes('unwrap()')) + 1,
          column: 0,
        });
        suggestions.push('Replace unwrap() with proper error handling using Result type');
      }

      if (!code.includes('ProgramResult') && code.includes('pub fn')) {
        suggestions.push('Consider returning ProgramResult for better error handling');
      }

      if (code.includes('AccountInfo') && !code.includes('check')) {
        suggestions.push('Add account validation checks using next_account_info and account checks');
      }

      if (!code.includes('msg!')) {
        suggestions.push('Add logging with msg!() macro for better debugging');
      }
    }

    // TypeScript/JavaScript checks
    if (language === 'typescript' || language === 'javascript') {
      if (code.includes('any')) {
        errors.push({
          message: 'Avoid using "any" type. Use specific types or unknown instead.',
          severity: 'warning',
          line: code.split('\n').findIndex(l => l.includes('any')) + 1,
          column: 0,
        });
      }

      if (!code.includes('try') && code.includes('await')) {
        suggestions.push('Add try-catch blocks around async operations for error handling');
      }
    }

    return { errors, suggestions };
  }

  /**
   * Generate optimization suggestions (pattern-based for demo)
   */
  private async generateOptimizations(request: OptimizationRequest): Promise<OptimizationResult> {
    const { code, language } = request;
    const optimizations: OptimizationResult['optimizations'] = [];

    if (language === 'rust') {
      if (code.includes('Vec::new()')) {
        optimizations.push({
          title: 'Pre-allocate Vector Capacity',
          description: 'Pre-allocating vector capacity can improve performance by reducing allocations',
          code: 'let mut vec = Vec::with_capacity(expected_size);',
          impact: 'medium',
        });
      }

      if (code.includes('clone()') && code.includes('String')) {
        optimizations.push({
          title: 'Use String References',
          description: 'Use &str instead of cloning Strings to avoid unnecessary allocations',
          code: 'fn process(data: &str) { /* ... */ }',
          impact: 'high',
        });
      }

      if (code.includes('for') && code.includes('.iter()')) {
        optimizations.push({
          title: 'Use Iterator Methods',
          description: 'Iterator methods like map, filter, fold are often more efficient',
          code: 'items.iter().filter(|x| condition).map(|x| transform(x)).collect()',
          impact: 'medium',
        });
      }
    }

    if (language === 'typescript' || language === 'javascript') {
      if (code.includes('for (let i = 0')) {
        optimizations.push({
          title: 'Use Array Methods',
          description: 'Array methods like map, filter, reduce are more readable and often faster',
          code: 'const result = array.map(item => transform(item));',
          impact: 'low',
        });
      }

      if (code.includes('JSON.parse') && code.includes('JSON.stringify')) {
        optimizations.push({
          title: 'Avoid Unnecessary JSON Operations',
          description: 'JSON parsing/stringifying is expensive. Use object spread or structuredClone instead',
          code: 'const copy = { ...original };',
          impact: 'high',
        });
      }
    }

    return { optimizations };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(type: string, request: any): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(request))
      .digest('hex');
    return `ai:${type}:${hash}`;
  }

  /**
   * Get from cache
   */
  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save to cache
   */
  private async saveToCache(key: string, data: any): Promise<void> {
    try {
      await redisClient.setex(key, Math.floor(config.cacheTtl / 1000), JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save to cache:', error);
    }
  }
}

export default new AISuggestionService();
