<script setup lang="ts">
import type { TabsItem, RadioGroupItem } from '@nuxt/ui';

const tabs = [
  {
    label: 'Schedule Post',
    slot: 'schedule_post' as const
  },
  {
    label: 'Schedule Repost',
    slot: 'schedule_repost' as const
  }
] satisfies TabsItem[];

const props = defineProps<{
  side: "left"|"right",
  timestamp?: Date
}>();

const emit = defineEmits<{ 'update:timestamp': [Date], 'close': [boolean] }>();
</script>

<template>
  <USlideover
    :close="false"
    :side="props.side"
  >
    <template #body>
      <UTabs :items="tabs" class="gap-4 w-full">
          <template #schedule_post="{ item }">
            <CreatePost :timestamp="timestamp" @update:timestamp="(date) => emit('update:timestamp', date)" @close="emit('close', true)"/>
          </template>

          <template #schedule_repost="{ item }">
              <CreateRepost :timestamp="timestamp" @update:timestamp="(date) => emit('update:timestamp', date)" @close="emit('close', true)"/>
          </template>
        </UTabs>
    </template>
  </USlideover>
</template>