import type React from "react";
import type { Components } from "react-markdown";
import type {
  DetailedHTMLProps,
  AnchorHTMLAttributes,
  HTMLAttributes,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Custom renderer components for ReactMarkdown
const MarkdownComponents: Partial<Components> = {
  // Override link rendering
  a: ({
    children,
    href,
    ...props
  }: DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >) => (
    <a
      {...props}
      href={href}
      className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  // Override code block rendering
  code: ({
    children,
    className,
    inline,
  }: HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
    inline ? (
      <code
        className={`bg-green-900/30 px-1 rounded font-mono ${className || ""}`}
      >
        {children}
      </code>
    ) : (
      <code
        className={`block bg-green-900/30 p-2 rounded font-mono my-2 overflow-x-auto ${
          className || ""
        }`}
      >
        {children}
      </code>
    ),
  // Override blockquote rendering
  blockquote: ({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className="border-l-2 border-green-500/50 pl-4 my-2 italic"
    >
      {children}
    </blockquote>
  ),
  // Override list rendering with tighter spacing
  ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="list-disc space-y-1 my-2">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="list-decimal space-y-1 my-2">
      {children}
    </ol>
  ),
  // Add list item component to control spacing
  li: ({ children, ...props }: HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="marker:text-green-500 ml-5">
      {children}
    </li>
  ),
  // Add paragraph component to handle bullet points in text
  p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => {
    const text = children?.toString() || "";
    // If the paragraph starts with a bullet point, render it as a list item
    if (text.startsWith("• ")) {
      return (
        <div className="flex items-start space-x-2 ml-5">
          <span className="text-green-500">•</span>
          <span>{text.substring(2)}</span>
        </div>
      );
    }
    return <p {...props}>{children}</p>;
  },
  // Override table rendering
  table: ({ children, ...props }: HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-4">
      <table {...props} className="border-collapse table-auto w-full">
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
    <th
      {...props}
      className="border border-green-500/30 px-4 py-2 bg-green-900/20"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} className="border border-green-500/30 px-4 py-2">
      {children}
    </td>
  ),
};

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none prose-green [&_li]:!my-0 [&_li_p]:!my-0 [&_p]:!my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
