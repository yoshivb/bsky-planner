export function getRequiredString(formData: FormData, key: string): string
{
	const value = formData.get(key);
	if(value === null || typeof value !== 'string')
	{
		throw createError({
			statusCode: 400,
			message: `${key} should be a string.`,
		});
	}
	return value;
}

export function getOptionalString(formData: FormData, key: string): string|undefined
{
	const value = formData.get(key);
	if(value !== null && typeof value === 'string')
	{
		return value;
	}
	return undefined;
}

export function getOptionalStringArray(formData: FormData, key: string): string[]|undefined
{
	const value = formData.getAll(key);
	if(value.length > 0)
	{
		if (!value.every((v) => typeof v === 'string'))
		{
			throw createError({
				statusCode: 400,
				message: `${key} should contain strings.`,
			});
		}
		return value;
	}
	return undefined;
}

export function getOptionalFileArray(formData: FormData, key: string): File[]|undefined
{
	const value = formData.getAll(key);
	if(value.length > 0)
	{
		if (!value.every((v) => v instanceof File))
		{
			throw createError({
				statusCode: 400,
				message: `${key} should contain files.`,
			});
		}

		return value;
	}
	return undefined;
}