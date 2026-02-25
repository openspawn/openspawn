import React from "react";
import { Color, FunnelVariantType } from "lib";
import { CustomTooltipProps, EventProps } from "../common";
type CalculateFrom = "first" | "previous";
type DataT = {
    value: number;
    name: string;
};
export interface FunnelChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data: DataT[];
    evolutionGradient?: boolean;
    gradient?: boolean;
    valueFormatter?: (value: number) => string;
    calculateFrom?: CalculateFrom;
    color?: Color | string;
    variant?: FunnelVariantType;
    yAxisPadding?: number;
    showYAxis?: boolean;
    showXAxis?: boolean;
    showArrow?: boolean;
    showGridLines?: boolean;
    showTooltip?: boolean;
    onValueChange?: (value: EventProps) => void;
    customTooltip?: React.ComponentType<CustomTooltipProps>;
    noDataText?: string;
    rotateLabelX?: {
        angle: number;
        verticalShift?: number;
        xAxisHeight?: number;
    };
    barGap?: number | `${number}%`;
    xAxisLabel?: string;
    yAxisLabel?: string;
}
declare const FunnelChart: ({ data, ...props }: FunnelChartProps) => React.JSX.Element;
export default FunnelChart;
