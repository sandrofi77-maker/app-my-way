import { Platform, View } from 'react-native'
import { ReactNode } from 'react'

type Item = { id: string }

type Props<T extends Item> = {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor?: (item: T) => string
}

function SortableListWeb<T extends Item>({ items, onReorder, renderItem, keyExtractor }: Props<T>) {
  const {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
  } = require('@dnd-kit/core')
  const {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
  } = require('@dnd-kit/sortable')
  const { CSS } = require('@dnd-kit/utilities')
  const React = require('react')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function SortableItem({ item, index }: { item: T; index: number }) {
    const id = keyExtractor ? keyExtractor(item) : item.id
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'grab',
      position: 'relative' as const,
      zIndex: isDragging ? 999 : 0,
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {renderItem(item, index)}
      </div>
    )
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => (keyExtractor ? keyExtractor(i) : i.id) === active.id)
    const newIndex = items.findIndex(i => (keyExtractor ? keyExtractor(i) : i.id) === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newItems = arrayMove(items, oldIndex, newIndex)
    onReorder(newItems)
  }

  const ids = items.map(i => keyExtractor ? keyExtractor(i) : i.id)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <SortableItem key={keyExtractor ? keyExtractor(item) : item.id} item={item} index={index} />
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableListNative<T extends Item>({ items, renderItem }: Props<T>) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={item.id}>{renderItem(item, index)}</View>
      ))}
    </View>
  )
}

export default function SortableList<T extends Item>(props: Props<T>) {
  if (Platform.OS === 'web') {
    return <SortableListWeb {...props} />
  }
  return <SortableListNative {...props} />
}
