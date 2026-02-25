import React, { ReactNode } from "react";
export interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    type?: "text" | "password" | "email" | "url" | "number" | "search" | "tel";
    defaultValue?: string | number;
    value?: string | number;
    icon?: React.ElementType | React.JSXElementConstructor<any>;
    error?: boolean;
    errorMessage?: string;
    disabled?: boolean;
    stepper?: ReactNode;
    onValueChange?: (value: any) => void;
    makeInputClassName: (className: string) => string;
    pattern?: string;
}
declare const BaseInput: React.ForwardRefExoticComponent<BaseInputProps & React.RefAttributes<HTMLInputElement>>;
export default BaseInput;
