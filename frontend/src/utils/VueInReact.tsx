import { useEffect, useRef } from 'react';
import { createApp, h } from 'vue';

type VueComponentProps = {
  component: any;
  [key: string]: any;
};

export function VueInReact({ component, ...props }: VueComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<ReturnType<typeof createApp> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a Vue app with the component
    const app = createApp({
      render: () => h(component, props),
    });

    // Mount the Vue app
    app.mount(containerRef.current);
    appRef.current = app;

    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        appRef.current.unmount();
        appRef.current = null;
      }
    };
  }, [component, props]);

  return <div ref={containerRef} />;
}

export default VueInReact;
