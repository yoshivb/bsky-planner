<script setup lang="ts">
import { addDays } from 'date-fns';

const props = defineProps<{
  timestamp?: Date
}>();

const emit = defineEmits<{ 'update:timestamp': [Date], 'close': [boolean] }>();

const newPostData = reactive({
  text: '',
  labels: undefined as LabelOptionType,
  embed: [] as {file: File, alt?: string}[],
  scheduled_for: props.timestamp ?? new Date(),
  repost_dates: undefined as Date[]|undefined
});

watch(() => newPostData.scheduled_for, (newTimestamp)=> {
  emit('update:timestamp', newTimestamp);
});

const postTextMaxLength = 300;

const addNewRepostDate = () => {
  if(newPostData.repost_dates === undefined)
  {
    newPostData.repost_dates = [];
  }
  let referenceDate = newPostData.repost_dates[newPostData.repost_dates.length-1] ?? newPostData.scheduled_for;
  newPostData.repost_dates.push(addDays(referenceDate, 1));
}
const removeRepostDate = (i: number) => {
  if(newPostData.repost_dates === undefined)
  {
    return;
  }
  let repost_dates = [...newPostData.repost_dates];
  repost_dates.splice(i, 1);
  if(repost_dates.length === 0)
  {
    newPostData.repost_dates = undefined;
  }
  else
  {
    newPostData.repost_dates = repost_dates;
  }
}

const submitScheduledPost = async () => {
  const formData = new FormData();
  formData.set("text", newPostData.text);
  formData.set("scheduled_for", newPostData.scheduled_for.toISOString());
  if(newPostData.labels)
  {
    formData.set("labels", newPostData.labels);
  }
  newPostData.embed?.forEach((embed) => {
    formData.append("embed_file", embed.file);
    formData.append("embed_alt", embed.alt ?? '');
  });
  newPostData.repost_dates?.forEach((repost_date) => {
    formData.append("repost_dates", repost_date.toISOString());
  });

  await $fetch('/api/posts', {
    method: 'post',
    body: formData
  });

  emit('close', true);
}
</script>

<template>
	<div class="flex flex-col gap-2">
		<UTextarea
		color="neutral" variant="subtle" 
		placeholder="Type something..."
		v-model="newPostData.text"
		:maxlength="postTextMaxLength"
		aria-describedby="character-count"
		:ui="{ trailing: 'pointer-events-none' }"
		class="w-full"
		>
			<template #trailing>
				<div
				id="character-count"
				class="text-xs text-muted tabular-nums"
				aria-live="polite"
				role="status"
				>
				{{ newPostData.text?.length }}/{{ postTextMaxLength }}
				</div>
			</template>
		</UTextarea>

		<UiFileUploadWithAlt v-model="newPostData.embed" />

		<div>
			<URadioGroup 
				color="primary" variant="card" size="sm"
				orientation="horizontal" indicator="hidden" 
				:items="LabelOptions"
				v-model="newPostData.labels"
				descriptionKey=""
				:ui="{
				fieldset: 'justify-content-center'
				}"
			/>
			<p class="text-xs text-muted min-h-lh">{{ LabelOptions.find((option)=>option.value === newPostData.labels)?.description }}</p>
		</div>

		<p>Schedule For</p>
		<UiDateTimeInput v-model="newPostData.scheduled_for" disallowPastDates/>

		<div class="flex flex-row gap-2">
			<p>Reposts?</p>
			<UButton @click="addNewRepostDate" icon="i-lucide-plus" size="sm"></UButton>
		</div>
		<div v-if="newPostData.repost_dates" v-for="(_,i) in newPostData.repost_dates"
			class="flex flex-row gap-2 justify-between">
			<UiDateTimeInput v-model="newPostData.repost_dates[i]" disallowPastDates/>
			<UButton @click="()=>removeRepostDate(i)" icon="i-lucide-minus" color="neutral" size="sm"></UButton>
		</div>

		<UButton icon="i-lucide-send" size="lg" class="justify-center" @click="submitScheduledPost">Schedule Post</UButton>
	</div>
</template>