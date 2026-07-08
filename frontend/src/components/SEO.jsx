import React, { useEffect } from 'react';

export default function SEO({ 
  title, 
  description, 
  canonical, 
  ogType = 'website', 
  faqList = [], 
  isTool = false, 
  isBlog = false, 
  blogMeta = null,
  breadcrumbs = []
}) {
  const currentUrl = canonical || window.location.href;

  useEffect(() => {
    // 1. Update Title
    document.title = title || 'Vidnexa - Universal Video Downloader';

    // Helper to get or create a meta tag
    const getOrCreateMeta = (attrName, attrVal) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      return element;
    };

    // Helper to get or create a link tag
    const getOrCreateLink = (relVal) => {
      let element = document.querySelector(`link[rel="${relVal}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', relVal);
        document.head.appendChild(element);
      }
      return element;
    };

    // 2. Meta Description
    if (description) {
      getOrCreateMeta('name', 'description').setAttribute('content', description);
    }

    // 3. Canonical URL
    getOrCreateLink('canonical').setAttribute('href', currentUrl);

    // 4. OpenGraph
    getOrCreateMeta('property', 'og:title').setAttribute('content', title);
    if (description) {
      getOrCreateMeta('property', 'og:description').setAttribute('content', description);
    }
    getOrCreateMeta('property', 'og:url').setAttribute('content', currentUrl);
    getOrCreateMeta('property', 'og:type').setAttribute('content', ogType);
    getOrCreateMeta('property', 'og:image').setAttribute('content', 'https://vidnexa.space/og-image.png');

    // 5. Twitter Card
    getOrCreateMeta('property', 'twitter:card').setAttribute('content', 'summary_large_image');
    getOrCreateMeta('property', 'twitter:url').setAttribute('content', currentUrl);
    getOrCreateMeta('property', 'twitter:title').setAttribute('content', title);
    if (description) {
      getOrCreateMeta('property', 'twitter:description').setAttribute('content', description);
    }
    getOrCreateMeta('property', 'twitter:image').setAttribute('content', 'https://vidnexa.space/og-image.png');

    // 6. JSON-LD Schemas injection
    const schemaScripts = [];

    const injectSchema = (schemaData, id) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(schemaData);
      schemaScripts.push(script);
    };

    // A. Organization Schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Vidnexa',
      'url': 'https://vidnexa.space',
      'logo': 'https://vidnexa.space/logo.png',
      'sameAs': [
        'https://twitter.com',
        'https://github.com'
      ]
    };
    injectSchema(orgSchema, 'ld-org-schema');

    // B. Website Schema (with SearchAction)
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Vidnexa',
      'url': 'https://vidnexa.space',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://vidnexa.space/?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    };
    injectSchema(websiteSchema, 'ld-website-schema');

    // C. BreadcrumbList Schema (if provided)
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'name': crumb.name,
          'item': crumb.url ? `https://vidnexa.space${crumb.url}` : currentUrl
        }))
      };
      injectSchema(breadcrumbSchema, 'ld-breadcrumb-schema');
    }

    // D. SoftwareApplication Schema (for downloader pages)
    if (isTool) {
      const toolSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': title.split(' | ')[0] || 'Vidnexa Downloader',
        'operatingSystem': 'All',
        'applicationCategory': 'MultimediaApplication',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.8',
          'ratingCount': '1024'
        }
      };
      injectSchema(toolSchema, 'ld-tool-schema');
    }

    // E. FAQPage Schema (for pages with FAQs)
    if (faqList && faqList.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqList.map(faq => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a
          }
        }))
      };
      injectSchema(faqSchema, 'ld-faq-schema');
    }

    // F. Article Schema (for blog articles)
    if (isBlog && blogMeta) {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': title,
        'image': 'https://vidnexa.space/og-image.png',
        'datePublished': blogMeta.datePublished || new Date().toISOString().split('T')[0],
        'author': {
          '@type': 'Organization',
          'name': 'Vidnexa SRE Team',
          'url': 'https://vidnexa.space'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Vidnexa',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://vidnexa.space/logo.png'
          }
        },
        'description': description
      };
      injectSchema(articleSchema, 'ld-article-schema');
    }

    // Cleanup on unmount (removes dynamic page schemas like FAQ, Tool, Article)
    return () => {
      const dynamicIds = ['ld-breadcrumb-schema', 'ld-tool-schema', 'ld-faq-schema', 'ld-article-schema'];
      dynamicIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };

  }, [title, description, currentUrl, ogType, faqList, isTool, isBlog, blogMeta, breadcrumbs]);

  return null;
}
