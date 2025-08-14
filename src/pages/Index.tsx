import { DriveExplorer } from '../components/DriveExplorer';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <DriveExplorer />
    </motion.div>
  );
};

export default Index;
