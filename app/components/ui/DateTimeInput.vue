<script setup lang="ts">
	import { CalendarDate, DateFormatter, getLocalTimeZone, now, type DateValue } from '@internationalized/date';

	const model = defineModel<Date>({default: new Date()});

	const props = defineProps<{
		disallowPastDates?: boolean
	}>()

	const modelDate = shallowRef(new CalendarDate(model.value.getFullYear(), model.value.getMonth()+1, model.value.getDate()) );
	const modelHour = ref(model.value.getHours());
	const modelMinutes = ref(model.value.getMinutes());
	watch([modelDate, modelHour, modelMinutes], ()=> {
		let newModelValue = modelDate.value.toDate(getLocalTimeZone());
		newModelValue.setHours(modelHour.value);
		newModelValue.setMinutes(modelMinutes.value);
		model.value = newModelValue;
	});
	watch(model, (newModelValue)=> {
		const newModelDate = new CalendarDate(newModelValue.getFullYear(), newModelValue.getMonth()+1, newModelValue.getDate());
		if(newModelDate.compare(modelDate.value) !== 0)
		{
			modelDate.value = newModelDate;
		}
		if(newModelValue.getHours() !== modelHour.value)
		{
			modelHour.value = newModelValue.getHours();
		}
		if(newModelValue.getMinutes() !== newModelValue.getMinutes())
		{
			modelMinutes.value = newModelValue.getMinutes();
		}
	})

	const df = new DateFormatter('en-UK', {
		dateStyle: 'medium'
	});

	const possibleHours = computed(() => {
		return Array.from({length: 24}, (_, i) => {
			return {
				label: `${i < 10 ? '0' : '' }${i}`,
				value: i
			};
		});
	});
	const possibleMinutes = computed(() => {
		const stepSize = 5;
		const count = 60 / stepSize;
		return Array.from({length: count}, (_, i) => {
			const min = i * stepSize;
			return {
				label: `${min < 10 ? '0' : '' }${min}`,
				value: min
			};
		});
	});

	const isDateDisabled = (date: DateValue) => {
		if(props.disallowPastDates)
		{
			return date.compare(now(getLocalTimeZone())) < 0;
		}
		return false;
	}
</script>
<template>
	<div class="flex flex-row gap-2">
		<UPopover>
			<UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
			{{ df.format(modelDate.toDate(getLocalTimeZone())) }}
			</UButton>

			<template #content>
				<UCalendar v-model="modelDate" class="p-2" :is-date-unavailable="isDateDisabled" />
			</template>
		</UPopover>
		<USelect v-model="modelHour" :items="possibleHours" class="w-20" />
		<USelect v-model="modelMinutes" :items="possibleMinutes" class="w-20" />
	</div>
</template>