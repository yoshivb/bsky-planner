export default defineAppConfig({
	ui: {
		radioGroup: {
			variants: {
				variant: {
					card: {
						item: 'rounded-full bg-elevated border-none group min-w-fit',
						label: 'text-muted'
					}
				}
			},
			compoundVariants: [
				{
					color: 'primary',
					variant: 'card',
					class: {
						item: 'has-data-[state=checked]:bg-primary',
						label: 'group-has-data-[state=checked]:text-inverted',
						description: 'group-has-data-[state=checked]:text-inverted/90'
					}
				}
			]
		}
	}
})
