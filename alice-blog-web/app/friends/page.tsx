import InnerPageShell from '../../components/InnerPageShell';
import PageTransition from '../../components/PageTransition';
import FriendsBoard from './FriendsBoard';
import { siteConfig } from '@/siteConfig';

export const metadata = {
  title: "友链 | " + siteConfig.title,
  description: "赛博空间里的有趣灵魂",
};

export default function FriendsPage() {
  return (
    <InnerPageShell>
      <PageTransition>
        <FriendsBoard />
      </PageTransition>
    </InnerPageShell>
  );
}
