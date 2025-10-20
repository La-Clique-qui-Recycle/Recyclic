// Service pour récupérer les informations de version depuis l'API
let versionCache = null;

export const getBuildInfo = async () => {
  if (versionCache) {
    return versionCache;
  }

  try {
    // Essayer d'abord l'endpoint /version de l'API
    const response = await fetch('/api/v1/health/version');
    if (!response.ok) {
      throw new Error('Version API not available');
    }
    
    const data = await response.json();
    versionCache = data;
    return data;
  } catch (error) {
    console.warn('Could not load version from API, trying build-info.json fallback:', error);
    
    try {
      // Fallback vers build-info.json si l'API n'est pas disponible
      const response = await fetch('/build-info.json');
      if (!response.ok) {
        throw new Error('Build info not found');
      }
      
      const data = await response.json();
      versionCache = data;
      return data;
    } catch (fallbackError) {
      console.warn('Could not load build info fallback:', fallbackError);
      // Dernier fallback avec les variables d'environnement
      return {
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        commitSha: import.meta.env.VITE_APP_COMMIT_SHA || 'dev',
        commitDate: 'unknown',
        buildDate: new Date().toISOString(),
        branch: 'unknown'
      };
    }
  }
};

export const getVersionDisplay = async () => {
  const buildInfo = await getBuildInfo();
  const { version, commitSha } = buildInfo;
  
  if (commitSha && commitSha !== 'dev' && commitSha !== 'unknown') {
    return `Version: ${version} (${commitSha})`;
  }
  
  return `Version: ${version}`;
};
