import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "bg-green-600 text-white hover:bg-green-700",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
        civic:
          "relative overflow-hidden rounded-sm px-8 py-4 font-semibold tracking-wide uppercase text-sm bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90",
        civicSecondary:
          "rounded-sm border-2 border-primary text-primary font-semibold tracking-wide uppercase text-sm px-8 py-4 hover:bg-primary hover:text-primary-foreground",
        contactPrimary: "rounded-none bg-primary text-primary-foreground hover:bg-primary/90",
        contactSecondary: "rounded-none bg-secondary hover:bg-muted border border-border",
        contactOutline:
          "rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const cardVariants = cva("rounded-sm border text-card-foreground", {
  variants: {
    variant: {
      default: "bg-card shadow-[var(--shadow-civic)]",
      civic:
        "relative rounded-sm bg-white p-8 border-border shadow-[var(--shadow-civic-lg)] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-primary before:to-accent before:rounded-t-sm",
      civicLg:
        "relative rounded-sm bg-white p-8 border-border shadow-[0_1px_3px_rgba(30,58,95,0.08),0_8px_24px_-12px_rgba(30,58,95,0.12)] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-primary before:to-accent before:rounded-t-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const inputVariants = cva(
  "flex w-full rounded-md border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-10 px-3 py-2 text-base border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm",
        civic:
          "px-5 py-4 text-lg bg-white border-2 border-border transition-all duration-300 placeholder:italic focus:border-primary focus:ring-4 focus:ring-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
