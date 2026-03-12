import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * rehype plugin that adds data-source-line attributes to elements
 * based on their position in the source markdown.
 */
export default function rehypeSourceLine() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.position?.start?.line != null) {
        if (!node.properties) node.properties = {};
        node.properties['dataSourceLine'] = node.position.start.line;
      }
    });
  };
}
