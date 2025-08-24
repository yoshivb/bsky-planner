<script lang="ts">
export interface ScheduleItem {
  scheduled_for: Date
}

export interface ScheduleProps<T extends ScheduleItem = ScheduleItem>{
  scheduledData?: T[],
  selectedTime?: Date
  loading?: boolean
}
</script>

<script setup lang="ts" generic="T extends ScheduleItem">
import { useWindowFocus, whenever } from '@vueuse/core'
import { addDays, addMinutes } from 'date-fns';

const emit = defineEmits<{
	'timeSelected': [date: Date]
}>();
const props = withDefaults(defineProps<ScheduleProps<T>>(), {});
const slots = defineSlots<{
	item(props: {item: T, currentTime: Date}):void
}>();

const startDate = defineModel<Date>('startDate', {required: true});
const daysDisplayed = defineModel<number>('daysDisplayed', {required: true});

const focused = useWindowFocus();

const currentTime = ref(new Date());
whenever(focused, () => {
	currentTime.value = new Date();
})

const startOfEachDay = computed(() => {
	return Array.from({length: daysDisplayed.value}, (_, i) => {
		const date = new Date(startDate.value.valueOf());
		date.setDate(date.getDate() + i);
		return date;
	});
});

const getShortDayName = (date: Date) => {
	const dateFormat = new Intl.DateTimeFormat("en-UK", {weekday: 'short'});
	return dateFormat.format(date);
}

const getDateNumber = (date: Date) => {
	const dateFormat = new Intl.DateTimeFormat("en-UK", {day: 'numeric'});
	return dateFormat.format(date);
}

const getHourText = (date: Date) => {
	const dateFormat = new Intl.DateTimeFormat("en-UK", {hour: '2-digit', minute: '2-digit'});
	return dateFormat.format(date);
}

const getShortMonthName = (date: Date) => {
	const dateFormat = new Intl.DateTimeFormat("en-UK", {month: 'short'});
	return dateFormat.format(date);
}

const nextPagination = () => {
	let newStartDate = addDays(startDate.value, daysDisplayed.value);
	startDate.value = newStartDate;
}

const prevPagination = () => {
	let newStartDate = addDays(startDate.value, -daysDisplayed.value);
	startDate.value = newStartDate;
}

const isSameHour = (time: Date, date: Date) => 
{
	return time.getHours() === date.getHours() && 
		time.getDate() === date.getDate() &&
		time.getMonth() === date.getMonth() &&
		time.getFullYear() === date.getFullYear();
}

const scheduleData = computed(() => {
	return startOfEachDay.value.map((startOfDay: Date) => {
		return Array.from({length: 24}, (_, i) => {
			const date = new Date(startOfDay.valueOf());
			date.setHours(i);
			return date;
		}).map((date) => {
			return {
				date: date,
				isSelected: props.selectedTime ? isSameHour(props.selectedTime, date) : false,
				scheduledData: props.scheduledData?.filter((data) => isSameHour(data.scheduled_for, date))
			}
		});
	})
});

const currentTimeEl = useTemplateRef("currentTimeEl");
onMounted(() => {
	currentTime.value = new Date();
	currentTimeEl.value?.[0]?.scrollIntoView({behavior: 'instant', block: 'center'});
});

const onTimestampClicked = (timestamp: Date) =>
{
	emit("timeSelected", timestamp);
}
</script>

<style lang="scss" scoped>
.selectedTime {
	--_selection-width: 3px;
	--_selection-color: var(--ui-primary);
}

.selectedTime::before {
	content: '';
	position: absolute;
	inset: calc(var(--_selection-width) * -1);
	border-radius: var(--_selection-width);
	border-color: var(--_selection-color);
	border-width: var(--_selection-width);
	z-index: 1;
}
.selectedTime::after {
	content: '';
	position: absolute;
	background-color: var(--_selection-color);
	width: 10px;
	height: 10px;
	border-radius: 50%;
	top: -5px;
	left: -5px;
}
</style>
<template>
	<div class="grid grid-cols-[auto_repeat(7,minmax(120px,_1fr))_auto] rounded">
		<div class="sticky top-0 z-10 grid grid-cols-subgrid col-span-9 bg-accented"
			:class="{
				'after:bg-emerald-500 after:absolute after:h-[2px] after:bottom-0 after:animate-[elastic_1s_ease-in-out_infinite] rtl:after:animate-[elastic-rtl_1s_ease-in-out_infinite]': loading
			}">
			<UButton
				variant="ghost" icon="i-mdi-chevron-left" size="xl"
				color="neutral"
				class="bg-accented rounded-r-none"
				@click="prevPagination"/>
			<div v-for="(day, i) of startOfEachDay"
				class="flex flex-col gap-2 p-2 items-center relative">
				<p class="text-sm">{{ getShortDayName(day) }}</p>
				<p class="text-xl">{{ `${getShortMonthName(day)} ${getDateNumber(day)}` }}</p>
			</div>
			<UButton  
				variant="ghost" icon="i-mdi-chevron-right" size="xl"
				color="neutral"
				class="bg-accented rounded-l-none"
				@click="nextPagination"/>
		</div>
		<div class="grid grid-cols-subgrid col-span-9 grid-rows-[repeat(96,_20px)] bg-muted">
			<div class="grid grid-rows-subgrid row-span-96 mx-3 mt-2">
				<div v-for="hourData in scheduleData[0]"
					class="relative row-span-4">
					<p class="text-sm -mt-2">{{ getHourText(hourData.date) }}</p>

					<div v-if="currentTime.getHours() === hourData.date.getHours()"
					class="h-[2px] w-[5px] bg-red-400 absolute -right-3"
					:style="{
						top: `${(currentTime.getMinutes() / 60) * 100}%`
					}">
					</div>
				</div>
			</div>
			<div class="grid grid-cols-subgrid grid-rows-subgrid col-span-7 row-span-96">
				<div v-for="(day, i) of startOfEachDay" 
					class="grid grid-rows-subgrid row-span-96">
					<div v-for="hourData in scheduleData[i]"
						class="border border-slate-700 relative grid row-span-4">
						<div v-if="isSameHour(currentTime, hourData.date)"
							class="w-full h-[2px] bg-red-400 absolute z-20"
							:style="{
								top: `${(currentTime.getMinutes() / 60) * 100}%`
							}" ref="currentTimeEl">
						</div>
						<UButton v-for="quarter in 4" variant="ghost" color="neutral" 
							@click="onTimestampClicked(addMinutes(hourData.date, 15.0 * (quarter-1)))"/>
						<div v-if="selectedTime && hourData.isSelected"
							class="w-full h-1/4 selectedTime absolute"
							:style="{
								top: `${(selectedTime.getMinutes() / 60) * 100}%`
							}">
						</div>
						<div v-if="scheduledData" v-for="item in hourData.scheduledData"
							class="inset-y-0 inset-x-4 absolute"
							:class="`notch-${Math.floor((item.scheduled_for.getMinutes() / 60) * 100)}`">
							<slot 
								name="item" :item="item" :currentTime="currentTime">
							</slot>
						</div>
					</div>
				</div>
			</div>
			<div class="grid grid-rows-subgrid row-span-96 w-full">
			</div>
		</div>
	</div>
</template>