import { PromptEnhancer } from '../llm/prompt-enhancer'
import { QualityValidationFramework } from './validation-framework'
import { ModelCapabilities, getModelCapabilities } from '../model-capabilities'

export interface TestCase {
  id: string
  name: string
  description: string
  input: {
    originalPrompt: string
    outputType: 'text-to-image' | 'image-text-to-image' | 'text-to-video' | 'image-text-to-video' | 'text-to-video-audio' | 'image-text-to-video-audio'
    platform?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
    style?: string
    aspectRatio?: '1:1' | '9:16' | '16:9' | '4:5'
    duration?: number
    qualityTier?: 'draft' | 'social' | 'production'
    modelId?: string
  }
  expectedOutcomes: {
    minQualityScore: number
    shouldContainKeywords: string[]
    shouldNotContainKeywords: string[]
    maxLength?: number
    minLength?: number
  }
  category: 'basic' | 'advanced' | 'edge_case' | 'performance' | 'consistency'
}

export interface TestResult {
  testCaseId: string
  passed: boolean
  actualQualityScore: number
  executionTime: number
  enhancedPrompt: string
  validationResult: any
  issues: string[]
  recommendations: string[]
}

export interface TestSuiteResult {
  suiteName: string
  totalTests: number
  passedTests: number
  failedTests: number
  overallScore: number
  executionTime: number
  results: TestResult[]
  summary: {
    categoryBreakdown: Record<string, { passed: number, total: number }>
    commonIssues: string[]
    performanceMetrics: {
      averageExecutionTime: number
      averageQualityScore: number
      consistencyScore: number
    }
  }
}

export class PromptEnhancementTestFramework {
  private promptEnhancer: PromptEnhancer
  private qualityValidator: QualityValidationFramework
  private testResults: Map<string, TestResult[]>

  constructor() {
    this.promptEnhancer = new PromptEnhancer()
    this.qualityValidator = new QualityValidationFramework()
    this.testResults = new Map()
  }

  // Comprehensive test suite for the LLM system
  getStandardTestSuite(): TestCase[] {
    return [
      // Basic Enhancement Tests
      {
        id: 'basic_001',
        name: 'Simple Image Generation',
        description: 'Test basic image prompt enhancement',
        input: {
          originalPrompt: 'a cat sitting',
          outputType: 'text-to-image',
          platform: 'general'
        },
        expectedOutcomes: {
          minQualityScore: 75,
          shouldContainKeywords: ['cat', 'sitting'],
          shouldNotContainKeywords: ['duplicate', 'blurry'],
          minLength: 50
        },
        category: 'basic'
      },
      {
        id: 'basic_002',
        name: 'Instagram Image Enhancement',
        description: 'Test Instagram-specific image enhancement',
        input: {
          originalPrompt: 'beautiful sunset',
          outputType: 'text-to-image',
          platform: 'instagram',
          aspectRatio: '1:1'
        },
        expectedOutcomes: {
          minQualityScore: 80,
          shouldContainKeywords: ['beautiful', 'sunset', 'aesthetic'],
          shouldNotContainKeywords: [],
          minLength: 60
        },
        category: 'basic'
      },
      
      // Video Enhancement Tests
      {
        id: 'video_001',
        name: 'Basic Video Generation',
        description: 'Test basic video prompt enhancement',
        input: {
          originalPrompt: 'person walking in park',
          outputType: 'text-to-video',
          platform: 'youtube',
          duration: 10
        },
        expectedOutcomes: {
          minQualityScore: 75,
          shouldContainKeywords: ['person', 'walking', 'park', 'cinematic'],
          shouldNotContainKeywords: [],
          minLength: 80
        },
        category: 'basic'
      },
      {
        id: 'video_002',
        name: 'Multi-Clip Video Generation',
        description: 'Test multi-clip video generation for longer content',
        input: {
          originalPrompt: 'a day in the life of a chef',
          outputType: 'text-to-video',
          platform: 'youtube',
          duration: 25
        },
        expectedOutcomes: {
          minQualityScore: 80,
          shouldContainKeywords: ['chef', 'day', 'life'],
          shouldNotContainKeywords: [],
          minLength: 100
        },
        category: 'advanced'
      },

      // Platform-Specific Tests
      {
        id: 'platform_001',
        name: 'TikTok Vertical Video',
        description: 'Test TikTok-specific optimizations',
        input: {
          originalPrompt: 'dance routine',
          outputType: 'text-to-video',
          platform: 'tiktok',
          aspectRatio: '9:16',
          duration: 15
        },
        expectedOutcomes: {
          minQualityScore: 78,
          shouldContainKeywords: ['dance', 'dynamic', 'engaging'],
          shouldNotContainKeywords: [],
          minLength: 70
        },
        category: 'basic'
      },
      {
        id: 'platform_002',
        name: 'LinkedIn Professional Content',
        description: 'Test LinkedIn professional optimization',
        input: {
          originalPrompt: 'business presentation',
          outputType: 'text-to-image',
          platform: 'linkedin'
        },
        expectedOutcomes: {
          minQualityScore: 80,
          shouldContainKeywords: ['business', 'presentation', 'professional'],
          shouldNotContainKeywords: ['casual', 'fun'],
          minLength: 60
        },
        category: 'basic'
      },

      // Advanced Quality Tests
      {
        id: 'quality_001',
        name: 'Duplicate Prevention',
        description: 'Test prevention of duplicate terms',
        input: {
          originalPrompt: 'high quality detailed high quality image',
          outputType: 'text-to-image',
          platform: 'general'
        },
        expectedOutcomes: {
          minQualityScore: 85,
          shouldContainKeywords: ['quality', 'detailed'],
          shouldNotContainKeywords: ['high quality high quality'],
          minLength: 40
        },
        category: 'advanced'
      },
      {
        id: 'quality_002',
        name: 'Style Consistency',
        description: 'Test consistent style application',
        input: {
          originalPrompt: 'portrait of woman',
          outputType: 'text-to-image',
          style: 'photorealistic',
          platform: 'general'
        },
        expectedOutcomes: {
          minQualityScore: 80,
          shouldContainKeywords: ['portrait', 'woman', 'photorealistic'],
          shouldNotContainKeywords: ['cartoon', 'anime'],
          minLength: 50
        },
        category: 'advanced'
      },

      // Edge Cases
      {
        id: 'edge_001',
        name: 'Very Short Prompt',
        description: 'Test handling of very short prompts',
        input: {
          originalPrompt: 'tree',
          outputType: 'text-to-image',
          platform: 'general'
        },
        expectedOutcomes: {
          minQualityScore: 70,
          shouldContainKeywords: ['tree'],
          shouldNotContainKeywords: [],
          minLength: 30
        },
        category: 'edge_case'
      },
      {
        id: 'edge_002',
        name: 'Very Long Prompt',
        description: 'Test handling of very long prompts',
        input: {
          originalPrompt: 'a highly detailed, photorealistic portrait of a beautiful young woman with long flowing hair, standing in a sunlit garden filled with colorful flowers, wearing an elegant white dress, with soft natural lighting creating a dreamy atmosphere, professional photography style, high resolution, extremely detailed, masterpiece quality',
          outputType: 'text-to-image',
          platform: 'general'
        },
        expectedOutcomes: {
          minQualityScore: 75,
          shouldContainKeywords: ['woman', 'garden', 'photorealistic'],
          shouldNotContainKeywords: [],
          maxLength: 800
        },
        category: 'edge_case'
      },

      // Performance Tests
      {
        id: 'perf_001',
        name: 'Complex Multi-Media',
        description: 'Test complex enhancement with multiple elements',
        input: {
          originalPrompt: 'corporate training video with text overlays',
          outputType: 'text-to-video',
          platform: 'linkedin',
          duration: 30
        },
        expectedOutcomes: {
          minQualityScore: 80,
          shouldContainKeywords: ['corporate', 'training', 'professional'],
          shouldNotContainKeywords: [],
          minLength: 100
        },
        category: 'performance'
      }
    ]
  }

  async runTestSuite(testCases: TestCase[] = this.getStandardTestSuite()): Promise<TestSuiteResult> {
    console.log('🧪 [Test Framework] Starting prompt enhancement test suite')
    console.log(`📊 [Test Framework] Running ${testCases.length} test cases`)
    
    const startTime = Date.now()
    const results: TestResult[] = []
    const categoryStats: Record<string, { passed: number, total: number }> = {}

    // Initialize category stats
    testCases.forEach(testCase => {
      if (!categoryStats[testCase.category]) {
        categoryStats[testCase.category] = { passed: 0, total: 0 }
      }
      categoryStats[testCase.category].total++
    })

    // Run each test case
    for (const testCase of testCases) {
      try {
        console.log(`🔬 [Test Framework] Running test: ${testCase.name}`)
        const result = await this.runSingleTest(testCase)
        results.push(result)
        
        if (result.passed) {
          categoryStats[testCase.category].passed++
        }
        
        console.log(`${result.passed ? '✅' : '❌'} [Test Framework] ${testCase.name}: ${result.passed ? 'PASSED' : 'FAILED'}`)
        
        // Add small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ [Test Framework] Test ${testCase.name} failed with error:`, error)
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actualQualityScore: 0,
          executionTime: 0,
          enhancedPrompt: '',
          validationResult: null,
          issues: [`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          recommendations: ['Please check test configuration and try again']
        })
      }
    }

    const executionTime = Date.now() - startTime
    const passedTests = results.filter(r => r.passed).length
    const failedTests = results.length - passedTests

    // Calculate performance metrics
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
    const averageQualityScore = results.reduce((sum, r) => sum + r.actualQualityScore, 0) / results.length
    
    // Calculate consistency score
    const qualityScores = results.map(r => r.actualQualityScore).filter(s => s > 0)
    const qualityVariance = qualityScores.length > 1 ? 
      qualityScores.reduce((acc, score) => acc + Math.pow(score - averageQualityScore, 2), 0) / qualityScores.length : 0
    const consistencyScore = Math.max(0, 100 - Math.sqrt(qualityVariance))

    // Identify common issues
    const allIssues = results.flatMap(r => r.issues)
    const issueFrequency = new Map<string, number>()
    allIssues.forEach(issue => {
      issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1)
    })
    const commonIssues = Array.from(issueFrequency.entries())
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([issue, _]) => issue)

    const testSuiteResult: TestSuiteResult = {
      suiteName: 'Prompt Enhancement Test Suite',
      totalTests: results.length,
      passedTests,
      failedTests,
      overallScore: Math.round((passedTests / results.length) * 100),
      executionTime,
      results,
      summary: {
        categoryBreakdown: categoryStats,
        commonIssues,
        performanceMetrics: {
          averageExecutionTime: Math.round(averageExecutionTime),
          averageQualityScore: Math.round(averageQualityScore * 100) / 100,
          consistencyScore: Math.round(consistencyScore * 100) / 100
        }
      }
    }

    // Store results
    this.testResults.set('latest', results)

    console.log('🏁 [Test Framework] Test suite completed')
    console.log(`📈 [Test Framework] Overall Score: ${testSuiteResult.overallScore}%`)
    console.log(`✅ [Test Framework] Passed: ${passedTests}/${results.length}`)
    console.log(`⏱️ [Test Framework] Total Time: ${executionTime}ms`)

    return testSuiteResult
  }

  private async runSingleTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // Get model capabilities
      const selectedModel = testCase.input.modelId ? 
        getModelCapabilities(testCase.input.modelId) :
        this.selectDefaultModelForTest(testCase.input.outputType)

      // Create enhancement context
      const enhancementContext = {
        originalPrompt: testCase.input.originalPrompt,
        selectedModel,
        platform: testCase.input.platform || 'general',
        outputType: testCase.input.outputType,
        style: testCase.input.style,
        aspectRatio: testCase.input.aspectRatio,
        duration: testCase.input.duration,
        qualityTier: testCase.input.qualityTier || 'social',
        mediaAssets: [],
        textElements: []
      }

      // Run enhancement
      const enhancementResult = await this.promptEnhancer.enhancePrompt(enhancementContext)

      // Create validation context
      const validationContext = {
        originalPrompt: testCase.input.originalPrompt,
        enhancedPrompt: enhancementResult.enhancedPrompt,
        negativePrompt: enhancementResult.negativePrompt,
        selectedModel,
        platform: testCase.input.platform,
        outputType: testCase.input.outputType
      }

      // Run quality validation
      const validationResult = await this.qualityValidator.validateEnhancement(validationContext)

      // Check test expectations
      const passed = this.evaluateTestResult(testCase, enhancementResult, validationResult)
      
      const executionTime = Date.now() - startTime

      return {
        testCaseId: testCase.id,
        passed,
        actualQualityScore: validationResult.quality_metrics.overall_score,
        executionTime,
        enhancedPrompt: enhancementResult.enhancedPrompt,
        validationResult,
        issues: validationResult.issues.map(issue => issue.message),
        recommendations: validationResult.recommendations
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      return {
        testCaseId: testCase.id,
        passed: false,
        actualQualityScore: 0,
        executionTime,
        enhancedPrompt: '',
        validationResult: null,
        issues: [`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check test configuration and system status']
      }
    }
  }

  private evaluateTestResult(testCase: TestCase, enhancementResult: any, validationResult: any): boolean {
    const expectations = testCase.expectedOutcomes
    let passed = true

    // Check quality score
    if (validationResult.quality_metrics.overall_score < expectations.minQualityScore) {
      passed = false
    }

    // Check required keywords
    const enhancedPromptLower = enhancementResult.enhancedPrompt.toLowerCase()
    for (const keyword of expectations.shouldContainKeywords) {
      if (!enhancedPromptLower.includes(keyword.toLowerCase())) {
        passed = false
        break
      }
    }

    // Check forbidden keywords
    for (const keyword of expectations.shouldNotContainKeywords) {
      if (enhancedPromptLower.includes(keyword.toLowerCase())) {
        passed = false
        break
      }
    }

    // Check length constraints
    const promptLength = enhancementResult.enhancedPrompt.length
    if (expectations.minLength && promptLength < expectations.minLength) {
      passed = false
    }
    if (expectations.maxLength && promptLength > expectations.maxLength) {
      passed = false
    }

    return passed
  }

  private selectDefaultModelForTest(outputType: string): ModelCapabilities {
    // Select appropriate default models for testing
    if (outputType.includes('video')) {
      return getModelCapabilities('runway-gen-3')
    } else if (outputType.includes('image')) {
      return getModelCapabilities('qwen-vl-max')
    } else {
      return getModelCapabilities('qwen-vl-max') // fallback
    }
  }

  // Regression testing - run against previous results
  async runRegressionTest(baselineResults?: TestResult[]): Promise<{
    regressionDetected: boolean,
    significantChanges: Array<{
      testId: string,
      change: 'improvement' | 'degradation',
      scoreDifference: number
    }>
  }> {
    if (!baselineResults) {
      console.warn('🔄 [Test Framework] No baseline results provided for regression testing')
      return { regressionDetected: false, significantChanges: [] }
    }

    const currentResults = await this.runTestSuite()
    const significantChanges: Array<{
      testId: string,
      change: 'improvement' | 'degradation',
      scoreDifference: number
    }> = []

    // Compare results
    currentResults.results.forEach(currentResult => {
      const baselineResult = baselineResults.find(r => r.testCaseId === currentResult.testCaseId)
      if (baselineResult) {
        const scoreDifference = currentResult.actualQualityScore - baselineResult.actualQualityScore
        
        // Consider changes > 10 points as significant
        if (Math.abs(scoreDifference) > 10) {
          significantChanges.push({
            testId: currentResult.testCaseId,
            change: scoreDifference > 0 ? 'improvement' : 'degradation',
            scoreDifference
          })
        }
      }
    })

    const regressionDetected = significantChanges.some(change => change.change === 'degradation')

    console.log(`🔍 [Test Framework] Regression analysis completed`)
    console.log(`📉 [Test Framework] Regression detected: ${regressionDetected}`)
    console.log(`🔄 [Test Framework] Significant changes: ${significantChanges.length}`)

    return { regressionDetected, significantChanges }
  }

  // Performance benchmarking
  async runPerformanceBenchmark(): Promise<{
    averageEnhancementTime: number,
    averageValidationTime: number,
    throughputTestsPerSecond: number,
    memoryUsage?: number
  }> {
    console.log('⚡ [Test Framework] Running performance benchmark')

    const performanceTests = this.getStandardTestSuite().filter(test => 
      test.category === 'basic' || test.category === 'performance'
    ).slice(0, 10) // Limit for performance testing

    const enhancementTimes: number[] = []
    const validationTimes: number[] = []

    const overallStartTime = Date.now()

    for (const testCase of performanceTests) {
      const enhancementStart = Date.now()
      
      // Run just the enhancement
      const selectedModel = this.selectDefaultModelForTest(testCase.input.outputType)
      const enhancementContext = {
        originalPrompt: testCase.input.originalPrompt,
        selectedModel,
        platform: testCase.input.platform || 'general',
        outputType: testCase.input.outputType,
        qualityTier: 'social' as const,
        mediaAssets: [],
        textElements: []
      }

      const enhancementResult = await this.promptEnhancer.enhancePrompt(enhancementContext)
      const enhancementTime = Date.now() - enhancementStart
      enhancementTimes.push(enhancementTime)

      // Run validation
      const validationStart = Date.now()
      const validationContext = {
        originalPrompt: testCase.input.originalPrompt,
        enhancedPrompt: enhancementResult.enhancedPrompt,
        selectedModel,
        platform: testCase.input.platform,
        outputType: testCase.input.outputType
      }

      await this.qualityValidator.validateEnhancement(validationContext)
      const validationTime = Date.now() - validationStart
      validationTimes.push(validationTime)
    }

    const totalTime = Date.now() - overallStartTime
    
    const averageEnhancementTime = enhancementTimes.reduce((a, b) => a + b, 0) / enhancementTimes.length
    const averageValidationTime = validationTimes.reduce((a, b) => a + b, 0) / validationTimes.length
    const throughputTestsPerSecond = (performanceTests.length / totalTime) * 1000

    console.log(`⚡ [Test Framework] Performance benchmark completed`)
    console.log(`🚀 [Test Framework] Avg Enhancement Time: ${Math.round(averageEnhancementTime)}ms`)
    console.log(`🔍 [Test Framework] Avg Validation Time: ${Math.round(averageValidationTime)}ms`)
    console.log(`📈 [Test Framework] Throughput: ${throughputTestsPerSecond.toFixed(2)} tests/sec`)

    return {
      averageEnhancementTime: Math.round(averageEnhancementTime),
      averageValidationTime: Math.round(averageValidationTime),
      throughputTestsPerSecond: parseFloat(throughputTestsPerSecond.toFixed(2))
    }
  }

  // Get test results history
  getTestResults(runId: string = 'latest'): TestResult[] | undefined {
    return this.testResults.get(runId)
  }

  // Clear test results
  clearTestResults(): void {
    this.testResults.clear()
    this.qualityValidator.clearCache()
    console.log('🗑️ [Test Framework] Test results and cache cleared')
  }
}