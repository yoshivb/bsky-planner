<script setup lang="ts">
definePageMeta({
  middleware: "login"
});

import { registerSchema, loginSchema } from '~~/shared/utils/types';
import type { FormSubmitEvent, TabsItem } from '@nuxt/ui';
import * as z from 'zod';

const toast = useToast();
const session = useUserSession();

const uiSchema = registerSchema.extend({
	confirm_password: z.string()
}).refine((data) => data.confirm_password === data.password, {
	error: "Confirm Password must be the same.",
	path: ['confirm_password']
})

type Schema = z.output<typeof uiSchema>;
const state = reactive<Schema>({
	handle: '',
	password: '',
	confirm_password: '',
	app_password: ''
});
const showToggleState = reactive({
	show_password: false,
	show_confirm_password: false,
	show_app_password: false
})

const tabItems = [
  {
    label: 'Login',
    icon: 'i-lucide-user',
    slot: 'login' as const
  },
  {
    label: 'Register',
    icon: 'i-lucide-lock',
    slot: 'register' as const
  }
] satisfies TabsItem[];

async function onLogin(event: FormSubmitEvent<z.output<typeof loginSchema>>) {
	try {
		const response = await $fetch('/api/auth/login', {
			method: 'POST',
			body: event.data
		});
		if(!response.success)
		{
			throw new Error("Login failed!");
		}

		await session.fetch();
		await navigateTo('/');
	}
	catch (e) {
		toast.add({
			color: 'error',
			title: 'Failed to login',
		});
	}
}

async function onRegister(event: FormSubmitEvent<Schema>) {
	try {
		const response = await $fetch('/api/auth/register', {
			method: 'POST',
			body: event.data
		});
		if(!response.success)
		{
			throw new Error("Register failed!");
		}

		await session.fetch();
		await navigateTo('/');
	}
	catch(e) {
		toast.add({
			color: 'error',
			title: 'Failed to register',
		});
	}
}

</script>
<template>
	<div class="min-h-screen grid">
		<div class="flex flex-col gap-2 p-4 bg-muted rounded-2xl place-self-center min-h-[600px] aspect-square">
			<h1 class="text-3xl font-bold">Bluesky Planner</h1>
			<UTabs :items="tabItems" variant="link" class="gap-4 w-full">
				<template #login="{item}">
					<UForm :schema="loginSchema" :state="state" @submit="onLogin"
						class="flex flex-col gap-2">
						<UFormField name="handle" label="Bluesky Handle" required>
							<UInput v-model="state.handle"
								class="w-full"
								placeholder="Your bluesky handle..."/>
						</UFormField>
						<UFormField name="password" label="Password" required>
							<UInput v-model="state.password"
								class="w-full"
								:type="showToggleState.show_password ? 'text' : 'password'"
								placeholder="Password...">
								<template #trailing>
									<UButton
										color="neutral"
										variant="link"
										size="sm"
										:icon="showToggleState.show_password ? 'i-lucide-eye-off' : 'i-lucide-eye'"
										:aria-label="showToggleState.show_password ? 'Hide password' : 'Show password'"
										:aria-pressed="showToggleState.show_password"
										aria-controls="password"
										@click="showToggleState.show_password = !showToggleState.show_password"
									/>
								</template>
							</UInput>
						</UFormField>
						<UButton
							type="submit"
							label="Login"
							color="neutral"
							size="xl"/>
					</UForm>
				</template>
				<template #register="{item}">
					<UForm :schema="uiSchema" :state="state" @submit="onRegister"
						class="flex flex-col gap-2">
						<UFormField name="handle" label="Bluesky Handle" required>
							<UInput v-model="state.handle"
								class="w-full"
								placeholder="Your bluesky handle..."/>
						</UFormField>
						<UFormField name="app_password" label="Bsky App Password" required>
							<UInput v-model="state.app_password"
								class="w-full"
								placeholder="App Password..."
								:type="showToggleState.show_app_password ? 'text' : 'password'">
								<template #trailing>
									<UButton
										color="neutral"
										variant="link"
										size="sm"
										:icon="showToggleState.show_app_password ? 'i-lucide-eye-off' : 'i-lucide-eye'"
										:aria-label="showToggleState.show_app_password ? 'Hide password' : 'Show password'"
										:aria-pressed="showToggleState.show_app_password"
										aria-controls="password"
										@click="showToggleState.show_app_password = !showToggleState.show_app_password"
									/>
								</template>
							</UInput>
						</UFormField>
						<UFormField name="password" label="Password" required>
							<UInput v-model="state.password"
								class="w-full"
								:type="showToggleState.show_password ? 'text' : 'password'"
								placeholder="Password...">
								<template #trailing>
									<UButton
										color="neutral"
										variant="link"
										size="sm"
										:icon="showToggleState.show_password ? 'i-lucide-eye-off' : 'i-lucide-eye'"
										:aria-label="showToggleState.show_password ? 'Hide password' : 'Show password'"
										:aria-pressed="showToggleState.show_password"
										aria-controls="password"
										@click="showToggleState.show_password = !showToggleState.show_password"
									/>
								</template>
							</UInput>
						</UFormField>
						<UFormField name="confirm_password" label="Confirm Password" required>
							<UInput v-model="state.confirm_password"
								class="w-full"
								:type="showToggleState.show_confirm_password ? 'text' : 'password'"
								placeholder="Confirm Password...">
								<template #trailing>
									<UButton
										color="neutral"
										variant="link"
										size="sm"
										:icon="showToggleState.show_confirm_password ? 'i-lucide-eye-off' : 'i-lucide-eye'"
										:aria-label="showToggleState.show_confirm_password ? 'Hide password' : 'Show password'"
										:aria-pressed="showToggleState.show_confirm_password"
										aria-controls="password"
										@click="showToggleState.show_confirm_password = !showToggleState.show_confirm_password"
									/>
								</template>
							</UInput>
						</UFormField>
						<UButton
							type="submit"
							label="Register"
							color="neutral"
							size="xl"/>
					</UForm>
				</template>
			</UTabs>
		</div>
	</div>
</template>