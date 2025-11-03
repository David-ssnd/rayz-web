import type { Metadata } from 'next';

import CanvaEmbed from '@/components/CanvaEmbed';
import { PageLayout } from '@/components/PageLayout';

export const metadata: Metadata = {
  title: 'Presentation | RayZ',
  description: 'Project presentation and overview slides',
};

export default function PresentationPage() {
  return (
    <PageLayout
      title="Project Presentation"
      description="Interactive presentation slides showcasing the RayZ project"
    >
      <div className="space-y-6">
        <CanvaEmbed
          url="https://www.canva.com/design/DAG1wt58las/r-xa2ln8hKv0UzK1o0MNsA/view"
          userName="Dávid Krivoklatský"
          designTitle="RayZ"
          aspectRatio={16 / 9}
        />
      </div>
    </PageLayout>
  );
}
