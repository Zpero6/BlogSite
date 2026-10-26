import InnerPageShell from '../../components/InnerPageShell';
import PageTransition from '../../components/PageTransition';
import ProjectsBoard from './ProjectsBoard';
import { siteConfig } from '@/siteConfig';

export const metadata = {
  title: "项目矩阵 | " + siteConfig.title,
  description: "开源项目与代码仓库展示",
};

export default function ProjectsPage() {
  return (
    <InnerPageShell size="wide">
      <PageTransition>
        <ProjectsBoard />
      </PageTransition>
    </InnerPageShell>
  );
}
