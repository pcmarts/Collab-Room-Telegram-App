import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && (
                <ToastTitle className={props.variant === "success" ? "text-white" : ""}>
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription 
                  className={props.variant === "success" ? "text-white opacity-90" : ""}
                >
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose 
              className={props.variant === "success" ? "text-white/70 hover:text-white" : ""}
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
