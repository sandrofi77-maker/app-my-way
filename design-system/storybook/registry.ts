import { StorySection } from './types'
import { foundationsSection } from './stories/foundations.stories'
import { actionsSection } from './stories/actions.stories'
import { dataDisplaySection } from './stories/dataDisplay.stories'
import { formsSection } from './stories/forms.stories'
import { feedbackSection } from './stories/feedback.stories'
import { overlaysSection } from './stories/overlays.stories'
import { navigationSection } from './stories/navigation.stories'
import { travelSection } from './stories/travel.stories'

export const storySections: StorySection[] = [
  foundationsSection,
  actionsSection,
  dataDisplaySection,
  formsSection,
  feedbackSection,
  overlaysSection,
  navigationSection,
  travelSection,
]
