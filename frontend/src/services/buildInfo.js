// Service pour récupérer les informations de build
let buildInfoCache = null;

export const getBuildInfo = async () => {
  if (buildInfoCache) {
    return buildInfoCache;
  }

  try {
    const response = await fetch('/build-info.json');
    if (!response.ok) {
      throw new Error('Build info not found');
    }
    
    const data = await response.json();
    buildInfoCache = data;
    return data;
  } catch (error) {
    console.warn('Could not load build info:', error);
    // Fallback avec les variables d'environnement
    return {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      commitSha: import.meta.env.VITE_APP_COMMIT_SHA || 'dev',
      commitDate: 'unknown',
      buildDate: new Date().toISOString(),
      branch: 'unknown'
    };
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
