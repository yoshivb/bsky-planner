<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();

const Logout = async () => {
  await clear();
  await navigateTo("/login");
};
</script>
<template>
	<div>
		<div class="p-3 max-w-6xl mx-auto flex justify-between">
			<h1 class="text-3xl font-bold">Bluesky Planner</h1>
			<UButton @click="Logout">
				Logout
			</UButton>
		</div>
	</div>
</template>