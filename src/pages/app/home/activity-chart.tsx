import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import type { ActivityDay } from '@/lib/check-in-activity'

const chartConfig = {
	count: {
		label: 'Check-ins',
		color: 'var(--chart-1)',
	},
} satisfies ChartConfig

export function ActivityChart({ data }: { data: ActivityDay[] }) {
	return (
		<ChartContainer config={chartConfig} className='h-[200px] w-full'>
			<BarChart data={data} accessibilityLayer>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey='label'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey='count' fill='var(--color-count)' radius={4} />
			</BarChart>
		</ChartContainer>
	)
}
