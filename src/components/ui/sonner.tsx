import { Icon } from "@/components/icons";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      className="toaster group"
      closeButton
      icons={{
        success: <Icon name="circle-check" className="h-4 w-4" />,
        info: <Icon name="info" className="h-4 w-4" />,
        warning: <Icon name="triangle-alert" className="h-4 w-4" />,
        error: <Icon name="octagon-x" className="h-4 w-4" />,
        loading: <Icon name="loader" className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:w-auto group-[.toaster]:max-w-[90vw]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
