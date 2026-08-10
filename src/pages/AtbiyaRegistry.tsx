import { Navigate } from 'react-router-dom';

/**
 * The congregation registry moved into the Organisation page as a tab, so every
 * level of the structure sits behind one entry rather than two.
 *
 * This redirect stays because /atbiya-registry is bookmarked, is linked from
 * Software Control's shortcut list, and was the sidebar entry for months.
 */
const AtbiyaRegistry = () => <Navigate to="/organisation?tab=atbiya" replace />;

export default AtbiyaRegistry;
