import PromptEnhancer from '@/components/PromptEnhancer'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PromptEnhancer />
    </div>
  )
}