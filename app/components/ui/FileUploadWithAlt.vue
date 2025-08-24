<script setup lang="ts">
	const config = useRuntimeConfig();
	type FileWithAlt = File & {alt?: string};

	const images = ref<FileWithAlt[]>([]);
	const altTextMaxLength = config.public.uploadLimits.maxAltLength;
	const maxFileSize = config.public.uploadLimits.maxFileSize;
	const maxAmountOfFiles = config.public.uploadLimits.maxFileCount;

	const modelValue = defineModel<{file: File, alt?: string, error?: string}[] | null>();

	const canAddMoreImages = computed(() => {
		return images.value.length < maxAmountOfFiles && (modelValue.value?.length ?? 0) < maxAmountOfFiles;
	})

	watch(modelValue, (newModelValue)=> {
		if(newModelValue?.length ?? 0 === images.value.length)
		{
			return;
		}
		if(!newModelValue)
		{
			images.value = [];
			return;
		}
		images.value = newModelValue.map((modelVal) => modelVal.file);
	})

	const imageUploadUI = computed(() => {
		let uistyle = {
			files: 'gap-1 justify-items-center',
			file: undefined as undefined|string,
			fileWrapper: ''
		}

		if(images.value.length <= 1)
		{
			uistyle = {
				...uistyle,
				files: uistyle.files + 'grid-cols-none md:grid-cols-none',
				file: 'aspect-auto'
			};
		}
		else if(images.value.length == 2)
		{
			uistyle =  {
				...uistyle,
				files: uistyle.files + 'grid-cols-2 md:grid-cols-2',
				file: 'aspect-square'
			};
		}
		else if(images.value.length == 3)
		{
			uistyle =  {
				...uistyle,
				files: uistyle.files + 'grid-cols-2 md:grid-cols-2',
				file: 'aspect-2/1 nth-1:aspect-square nth-1:row-span-2'
			};
		}
		else if(images.value.length == 4)
		{
			uistyle =  {
				...uistyle,
				files: uistyle.files + 'grid-cols-2 md:grid-cols-2',
				file: 'aspect-3/2'
			};
		}

		return uistyle;
	});

	const OnImagesUpdated = () => {
		if(images.value.length === 0)
		{
			modelValue.value = null;
		}
		if(images.value.length > maxAmountOfFiles)
		{
			images.value = images.value.slice(0,maxAmountOfFiles);
		}
		modelValue.value = images.value.map((file, index) => {
			let error : string|undefined = undefined;
			if(file.size > maxFileSize)
			{
				error = `File is bigger than 1MB!`;
			}
			if(file.alt && file.alt.length > altTextMaxLength)
			{
				error = `Alt is more than 2000 characters!`;
			}
			return {
				file,
				alt: file.alt,
				error
			}
		});
	}

	function createObjectUrl(file: File): string {
		return URL.createObjectURL(file)
	}

	const altToolTipTruncateLength = 30;
	const truncateAltText = (altText?: string) => {
		if (altText && altText.length > altToolTipTruncateLength) {
			return altText.substring(0, altToolTipTruncateLength) + "...";
		} else {
			return altText && altText.length > 0 ? altText : undefined;
		}
	}
</script>
<template>
	<UFileUpload 
		accept="image/*" 
		multiple 
		class="w-full"
		icon="i-lucide-image"
		label="Add your images here"
		layout="grid"
		:description="`(max. ${maxAmountOfFiles} images, ${formatBytes(maxFileSize)} each)`"
		:interactive="false"
		v-model="images" :ui="imageUploadUI"
		@change="OnImagesUpdated">
		<template #actions="{ open }">
			<UButton
				label="Add images"
				icon="i-lucide-upload"
				color="neutral"
				variant="outline"
				@click="open()"
				:disabled="!canAddMoreImages"
			/>
		</template>
		<template #files-bottom="{ open, files }">
			<UButton v-if="canAddMoreImages"
				label="Add images"
				icon="i-lucide-upload"
				color="neutral"
				variant="outline"
				class="mx-auto"
				@click="open()"
			/>
		</template>
		<template #file-leading="{file, index}">
			<UAvatar :src="createObjectUrl(file)" icon="i-lucide-image" size="lg" class="shrink-0 size-full rounded-lg" />
			<UAlert v-if="modelValue?.[index]?.error"
				class="absolute bottom-1 inset-x-1 p-2 w-auto"
				color="error"
				:description="modelValue?.[index]?.error"
			/>
			<UModal title="Add Alt">
				<UTooltip :text="truncateAltText(images[index]?.alt)">
					<UButton
						label="Alt"
						icon="i-lucide-plus"
						color="neutral"
						variant="subtle"
						size="xs"
						class="absolute top-1 left-1 bg-elevated/60"
					/>
				</UTooltip>
				<template #body="{close}">
					<div class="flex flex-col gap-2">
						<UAvatar :src="createObjectUrl(file)" icon="i-lucide-image" size="lg" class="shrink-0 size-full rounded-lg" />
						<UTextarea
							color="neutral" variant="subtle" 
							placeholder="Type something..."
							v-model="(file as FileWithAlt).alt"
							:maxlength="altTextMaxLength"
							aria-describedby="character-count"
							:ui="{ trailing: 'pointer-events-none' }"
							class="w-full">
							<template #trailing>
								<div
									id="character-count"
									class="text-xs text-muted tabular-nums"
									aria-live="polite"
									role="status">
								{{ images[index]?.alt?.length }}/{{ altTextMaxLength }}
								</div>
							</template>
						</UTextarea>
						<UButton @click="close" size="lg">Save</UButton>
					</div>
    			</template>
			</UModal>
		</template>
	</UFileUpload>
</template>