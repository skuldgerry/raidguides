import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

// Central place to register custom MDX components (Callout, Steps, Tabs, Cards, etc.)
// used to break long guide text into scannable blocks.
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  };
}
