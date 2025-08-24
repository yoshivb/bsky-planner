<script setup lang="ts">

const props = defineProps<{
  timestamp?: Date
}>();

const emit = defineEmits<{ 'update:timestamp': [Date], 'close': [boolean] }>();

const newRepostData = reactive({
  url: '',
  scheduled_for: props.timestamp ?? new Date(),
});

watch(() => newRepostData.scheduled_for, (newTimestamp)=> {
  emit('update:timestamp', newTimestamp);
});

const submitScheduledRepost = async () => {
  const formData = new FormData();
  formData.set("url", newRepostData.url);
  formData.set("scheduled_for", newRepostData.scheduled_for.toISOString());

  await $fetch('/api/reposts', {
    method: 'post',
    body: formData
  });

  emit('close', true);
}
</script>
<template>
	<div class="flex flex-col gap-2">
		<UInput placeholder="Post URL..." v-model="newRepostData.url" />
		<p>Schedule For</p>
		<UiDateTimeInput v-model="newRepostData.scheduled_for" disallowPastDates/>
		<UButton icon="i-lucide-send" size="lg" class="justify-center" @click="submitScheduledRepost">Schedule Repost</UButton>
	</div>
</template>