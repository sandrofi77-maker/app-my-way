import { MaterialCommunityIcons } from '@expo/vector-icons'

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

type Props = {
  name: IconName
  size?: number
  color?: string
}

export default function Icon({ name, size = 24, color = '#000000' }: Props) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />
}
