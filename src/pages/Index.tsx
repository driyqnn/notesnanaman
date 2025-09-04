import { DriveExplorer } from '../components/DriveExplorer';
import { DynamicThemeEngine } from '../components/DynamicThemeEngine';
import { WifiIndicator } from '../components/WifiIndicator';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useGitHubCommit } from '../hooks/useGitHubCommit';

const Index = () => {
  const [searchParams] = useSearchParams();
  const { commit, loading: commitLoading } = useGitHubCommit();
  const path = searchParams.get('path');
  const folderId = searchParams.get('folder');
  const target = searchParams.get('target');
  const id = searchParams.get('id');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      className="relative min-h-screen"
    >
      <DynamicThemeEngine subject="math" isActive={true} />
      <DriveExplorer initialPath={path} initialFolderId={folderId} targetFileId={target || id} />
    </motion.div>
  );
};

export default Index;
