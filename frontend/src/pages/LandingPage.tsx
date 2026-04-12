import { useNavigate } from 'react-router-dom'
import { BackgroundPaths } from '@/components/ui/background-paths'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-[90]">
      <BackgroundPaths
        title="StudyAI"
        buttonText="Enter StudyAI"
        onButtonClick={() => navigate('/login')}
      />
    </div>
  )
}
