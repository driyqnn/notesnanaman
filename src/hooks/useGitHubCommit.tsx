import { useState, useEffect } from 'react';

// Configuration - Update these values to change repo/branch
const GITHUB_CONFIG = {
  owner: 'driyqnn',
  repo: 'notesnanaman',
  branch: 'main'
};

interface GitHubCommit {
  sha: string;
  shortSha: string;
}

export const useGitHubCommit = () => {
  const [commit, setCommit] = useState<GitHubCommit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestCommit = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/commits?sha=${GITHUB_CONFIG.branch}&per_page=1`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            }
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const latestCommit = data[0]; // Get the first commit from the array
        
        setCommit({
          sha: latestCommit.sha,
          shortSha: latestCommit.sha.substring(0, 7)
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commit');
        console.error('Error fetching GitHub commit:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCommit();
  }, []);

  return { commit, loading, error };
};