import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface ScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface LoanChartProps {
  data: ScheduleItem[];
}

export function LoanChart({ data }: LoanChartProps) {
  const chartContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !chartContainer.current) return;

    const element = chartContainer.current;
    d3.select(element).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([1, data.length])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.payment) || 0])
      .range([height, 0]);

    const stack = d3.stack<ScheduleItem>()
      .keys(['principal', 'interest'] as any);

    const series = stack(data);

    const area = d3.area<any>()
      .x(d => x(d.data.month))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    const colors = ['#FFFFFF', '#DC143C'];

    svg.selectAll('path')
      .data(series)
      .enter()
      .append('path')
      .attr('fill', (d, i) => colors[i])
      .attr('opacity', 0.6)
      .attr('d', area);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(Math.min(data.length, 10)))
      .attr('color', 'rgba(255, 255, 255, 0.5)'); 

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', 'rgba(255, 255, 255, 0.5)'); 

    const legend = svg.append('g')
      .attr('transform', `translate(${width - 100}, 0)`);

    legend.append('rect').attr('width', 10).attr('height', 10).attr('fill', colors[0]);
    legend.append('text').attr('x', 15).attr('y', 10).text('Kapitał').attr('fill', 'rgba(255, 255, 255, 0.5)').attr('font-size', '10px');

    legend.append('rect').attr('width', 10).attr('height', 10).attr('y', 15).attr('fill', colors[1]);
    legend.append('text').attr('x', 15).attr('y', 25).text('Odsetki').attr('fill', 'rgba(255, 255, 255, 0.5)').attr('font-size', '10px');
  }, [data]);

  return (
    <div ref={chartContainer} className="w-full h-64 bg-white/5 border border-white/10 rounded-xl overflow-hidden"></div>
  );
}
