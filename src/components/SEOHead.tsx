import { useEffect } from 'react';
import { FolderItem, FileItem } from '../types/drive';

interface SEOHeadProps {
  currentFolder: FolderItem | null;
  currentPath: string;
  totalFiles?: number;
  totalFolders?: number;
  children?: (FileItem | FolderItem)[];
  pageType?: 'drive' | 'changelog' | 'feedback';
  customTitle?: string;
  customDescription?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  currentFolder,
  currentPath,
  totalFiles = 0,
  totalFolders = 0,
  children = [],
  pageType = 'drive',
  customTitle,
  customDescription
}) => {
  useEffect(() => {
    // Dynamic page title
    const brand = 'notesnicharles | Academic Resource Browser';
    const siteName = window.location.host;
    
    let title = '';
    if (customTitle) {
      title = `${customTitle} | ${brand}`;
    } else if (pageType === 'changelog') {
      title = `Changelog - Version History | ${brand}`;
    } else if (pageType === 'feedback') {
      title = `Feedback & Suggestions | ${brand}`;
    } else {
      const folderName = (currentFolder?.name || 'Academic Resources').toString();
      const fileCount = children?.filter(item => item.type === 'file').length || 0;
      title = fileCount > 0 ? `${folderName} (${fileCount} files) | ${brand}` : `${folderName} | ${brand}`;
    }
    
    document.title = title;

    // Dynamic meta description
    const createMetaDescription = () => {
      if (customDescription) {
        return customDescription;
      }
      
      if (pageType === 'changelog') {
        return 'Track file system changes, version history, and updates across all academic resources. View detailed changelogs with file additions, modifications, and deletions. Stay updated with the latest educational content.';
      } else if (pageType === 'feedback') {
        return 'Share your feedback and suggestions to improve notesnicharles. Help us enhance your academic study experience with better features and content organization.';
      } else if (currentPath === '/') {
        return `Browse ${totalFiles} academic files across ${totalFolders} folders. Access comprehensive study materials, lecture notes, and educational resources organized by subject and academic level.`;
      }
      
      const fileCount = children?.filter(item => item.type === 'file').length || 0;
      const folderCount = children?.filter(item => item.type === 'folder').length || 0;
      const folderName = (currentFolder?.name || 'Academic Resources').toString();
      
      if (fileCount === 0 && folderCount === 0) {
        return `Explore ${folderName} section. Discover academic notes, study materials, and educational resources for enhanced learning.`;
      }
      
      return `Explore ${folderName} containing ${fileCount} files${folderCount > 0 ? ` and ${folderCount} folders` : ''}. Find academic notes, study materials, lecture notes, and educational resources to boost your learning.`;
    };

    const description = createMetaDescription();
    
    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', description);
      document.head.appendChild(metaDesc);
    }

    // Dynamic Open Graph tags
    const updateOrCreateMetaTag = (property: string, content: string, nameAttr = 'property') => {
      let meta = document.querySelector(`meta[${nameAttr}="${property}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(nameAttr, property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Generate dynamic OG image URL
    const createOGImageUrl = () => {
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      
      if (pageType === 'changelog') {
        params.set('title', 'Changelog');
        params.set('subtitle', 'Track all file changes');
        params.set('type', 'changelog');
      } else if (pageType === 'feedback') {
        params.set('title', 'Feedback');
        params.set('subtitle', 'Help us improve');
        params.set('type', 'feedback');
      } else {
        const folderName = (currentFolder?.name || 'Home').toString();
        params.set('title', folderName);
        params.set('subtitle', `${children?.filter(item => item.type === 'file').length || 0} files • ${children?.filter(item => item.type === 'folder').length || 0} folders`);
        params.set('type', 'folder');
      }
      
      // Using a placeholder OG image service - in production you'd want your own
      return `https://og-image.vercel.app/${encodeURIComponent(params.get('title') || 'Academic Resources')}.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fhyper-color-logo.svg`;
    };

    const ogImageUrl = createOGImageUrl();

    // Open Graph tags
    updateOrCreateMetaTag('og:title', document.title);
    updateOrCreateMetaTag('og:description', description);
    updateOrCreateMetaTag('og:type', 'website');
    updateOrCreateMetaTag('og:url', window.location.href);
    updateOrCreateMetaTag('og:image', ogImageUrl);
    updateOrCreateMetaTag('og:image:width', '1200', 'property');
    updateOrCreateMetaTag('og:image:height', '630', 'property');
    updateOrCreateMetaTag('og:site_name', brand, 'property');

    // Twitter Card tags  
    updateOrCreateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateOrCreateMetaTag('twitter:title', document.title, 'name');
    updateOrCreateMetaTag('twitter:description', description, 'name');
    updateOrCreateMetaTag('twitter:image', ogImageUrl, 'name');
    updateOrCreateMetaTag('twitter:site', '@notesnicharles', 'name');

    // Additional meta tags for academic content
    updateOrCreateMetaTag('robots', 'index, follow', 'name');
    updateOrCreateMetaTag('author', 'notesnicharles hahahaha', 'name');
    
    const createKeywords = () => {
      const baseKeywords = 'academic notes, study materials, educational resources, lecture notes, university files';
      if (pageType === 'changelog') {
        return `${baseKeywords}, changelog, version history, file changes, updates`;
      } else if (pageType === 'feedback') {
        return `${baseKeywords}, feedback, suggestions, user experience, improvements`;
      } else if (currentFolder?.name) {
        return `${baseKeywords}, ${currentFolder.name.toLowerCase()}, academic folder`;
      }
      return baseKeywords;
    };
    
    updateOrCreateMetaTag('keywords', createKeywords(), 'name');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', window.location.href);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', window.location.href);
      document.head.appendChild(canonical);
    }

    // Structured data for breadcrumbs
    const createBreadcrumbStructuredData = () => {
      if (currentPath === '/') return null;

      const pathParts = currentPath.split('/').filter(Boolean);
      const breadcrumbItems = [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "notesnicharles hahahaha",
          "item": window.location.origin
        }
      ];

      pathParts.forEach((part, index) => {
        const pathToThisLevel = '/' + pathParts.slice(0, index + 1).join('/') + '/';
        const url = new URL(window.location.href);
        const urlPath = pathToThisLevel.slice(1, -1).split('/').map(p => 
          p.toLowerCase().replace(/\s+/g, '-')
        ).join('/');
        
        if (urlPath) {
          url.searchParams.set("path", urlPath);
        } else {
          url.searchParams.delete("path");
        }

        breadcrumbItems.push({
          "@type": "ListItem",
          "position": index + 2,
          "name": part.replace(/-/g, ' '),
          "item": url.toString()
        });
      });

      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems
      };
    };

    // Organization structured data
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "notesnicharles hahahaha",
      "description": "Educational resource browser for academic notes and study materials",
      "url": window.location.origin
    };

    // WebSite structured data
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "notesnicharles hahahaha",
      "description": "Browse and access academic notes, study materials, and educational resources",
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": window.location.origin + "?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    };

    // Update structured data
    const updateStructuredData = () => {
      // Remove existing structured data
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());

      // Add organization schema
      const orgScript = document.createElement('script');
      orgScript.type = 'application/ld+json';
      orgScript.textContent = JSON.stringify(organizationSchema);
      document.head.appendChild(orgScript);

      // Add website schema
      const websiteScript = document.createElement('script');
      websiteScript.type = 'application/ld+json';
      websiteScript.textContent = JSON.stringify(websiteSchema);
      document.head.appendChild(websiteScript);

      // Add breadcrumb schema if available
      const breadcrumbSchema = createBreadcrumbStructuredData();
      if (breadcrumbSchema) {
        const breadcrumbScript = document.createElement('script');
        breadcrumbScript.type = 'application/ld+json';
        breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
        document.head.appendChild(breadcrumbScript);
      }
    };

    updateStructuredData();

    // Cleanup function
    return () => {
      // No cleanup needed as we're updating existing elements
    };
  }, [currentFolder, currentPath, totalFiles, totalFolders, children, pageType, customTitle, customDescription]);

  return null; // This component doesn't render anything
};