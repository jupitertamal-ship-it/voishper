import { useParams } from 'react-router-dom';
import { OmniWidget } from '@/components/OmniWidget';

const WidgetDemo = () => {
  const { botId } = useParams();

  if (!botId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">No bot ID provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold mb-4">Widget Preview</h1>
        <p className="text-muted-foreground">This is how the OmniChat widget will appear on your website. Click the bubble in the bottom-right corner to open the chat.</p>
      </div>
      <OmniWidget botId={botId} />
    </div>
  );
};

export default WidgetDemo;
