import { useEffect } from 'react';
import { FolderItem, FileItem } from '../types/drive';

interface SEOHeadProps {
  currentFolder: FolderItem | null;
  currentPath: string;
  totalFiles?: number;
  totalFolders?: number;
  children?: (FileItem | FolderItem)[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  currentFolder,
  currentPath,
  totalFiles = 0,
  totalFolders = 0,
  children = []
}) => {
  useEffect(() => {
    // Dynamic page title
    const brand = 'notesnicharles hahahaha';
    const folderName = (currentFolder?.name || 'Home').toString();
    const title = `${folderName} | ${brand} | ${window.location.host}`;
    
    document.title = title;

    // Dynamic meta description
    const createMetaDescription = () => {
      if (currentPath === '/') {
        return `Browse ${totalFiles} academic files and ${totalFolders} folders. Access study materials, lecture notes, and educational resources organized by subject.`;
      }
      
      const fileCount = children?.filter(item => item.type === 'file').length || 0;
      const folderCount = children?.filter(item => item.type === 'folder').length || 0;
      
      return `Explore ${folderName} containing ${fileCount} files and ${folderCount} folders. Find academic notes, study materials, and educational resources.`;
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

    // Open Graph tags
    updateOrCreateMetaTag('og:title', document.title);
    updateOrCreateMetaTag('og:description', description);
    updateOrCreateMetaTag('og:type', 'website');
    updateOrCreateMetaTag('og:url', window.location.href);

    // Twitter Card tags
    updateOrCreateMetaTag('twitter:card', 'summary', 'name');
    updateOrCreateMetaTag('twitter:title', document.title, 'name');
    updateOrCreateMetaTag('twitter:description', description, 'name');

    // Additional meta tags for academic content
    updateOrCreateMetaTag('robots', 'index, follow', 'name');
    updateOrCreateMetaTag('author', 'notesnicharles hahahaha', 'name');
    updateOrCreateMetaTag('keywords', 'academic notes, study materials, educational resources, lecture notes, university files', 'name');

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
  }, [currentFolder, currentPath, totalFiles, totalFolders, children]);

  return null; // This component doesn't render anything
};