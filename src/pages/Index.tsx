import { DriveExplorer } from '../components/DriveExplorer';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

const Index = () => {
  const [searchParams] = useSearchParams();
  const path = searchParams.get('path');
  const folderId = searchParams.get('folder');
  const target = searchParams.get('target');
  const id = searchParams.get('id');

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <DriveExplorer initialPath={path} initialFolderId={folderId} targetFileId={target || id} />
    </motion.div>
  );
};

export default Index;
