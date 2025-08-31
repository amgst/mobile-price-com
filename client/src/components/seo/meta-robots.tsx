import { Helmet } from "react-helmet-async";

interface MetaRobotsProps {
  index?: boolean;
  follow?: boolean;
  archive?: boolean;
  snippet?: boolean;
  imageIndex?: boolean;
}

/**
 * Meta robots component for fine-grained control over search engine crawling
 */
export function MetaRobots({
  index = true,
  follow = true,
  archive = true,
  snippet = true,
  imageIndex = true,
}: MetaRobotsProps) {
  const robotsDirectives = [];
  
  // Basic indexing
  robotsDirectives.push(index ? "index" : "noindex");
  robotsDirectives.push(follow ? "follow" : "nofollow");
  
  // Additional directives
  if (!archive) robotsDirectives.push("noarchive");
  if (!snippet) robotsDirectives.push("nosnippet");
  if (!imageIndex) robotsDirectives.push("noimageindex");
  
  // Add advanced directives for better SEO
  robotsDirectives.push("max-snippet:-1"); // No limit on snippet length
  robotsDirectives.push("max-image-preview:large"); // Allow large image previews
  robotsDirectives.push("max-video-preview:-1"); // No limit on video preview
  
  const robotsContent = robotsDirectives.join(",");

  return (
    <Helmet>
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
    </Helmet>
  );
}