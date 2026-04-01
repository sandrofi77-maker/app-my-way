import { MaterialIcons } from '@expo/vector-icons'

type IconName = React.ComponentProps<typeof MaterialIcons>['name']

type Props = {
  name: IconName
  size?: number
  color?: string
}

export default function Icon({ name, size = 24, color = '#000000' }: Props) {
  return <MaterialIcons name={name} size={size} color={color} />
}
