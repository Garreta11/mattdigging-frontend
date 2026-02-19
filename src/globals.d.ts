import type { CalendarDateProps, CalendarMonthProps } from "cally";

type MapEvents<T> = {
  [K in keyof T as K extends `on${infer E}`
    ? `on${Lowercase<E>}`
    : K]: T[K];
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "calendar-month": MapEvents<CalendarMonthProps> & React.HTMLAttributes<HTMLElement>;
      "calendar-date": MapEvents<CalendarDateProps> & React.HTMLAttributes<HTMLElement> & { ref?: React.RefObject<HTMLElement> };
    }
  }
}

// Fix 'slot' not existing on SVGProps
declare namespace React {
  interface SVGProps<T> extends React.HTMLAttributes<T> {
    slot?: string;
  }
}