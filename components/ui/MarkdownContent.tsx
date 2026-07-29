import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Props = {
  content: string;
  className?: string;
};

/** TipTap highlight uses ==text== — convert for HTML rendering */
function withHighlightMarks(content: string) {
  return content.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
}

export default function MarkdownContent({ content, className = "" }: Props) {
  return (
    <div className={`markdown-body text-sm leading-relaxed text-ink/80 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h2: ({ children }) => (
            <h3 className="mb-2 mt-5 font-display text-base font-bold text-ink first:mt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-4 text-sm font-bold text-ink">{children}</h4>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic text-ink/75">{children}</em>,
          mark: ({ children }) => (
            <mark className="rounded-sm bg-marigold/25 px-0.5 text-ink">{children}</mark>
          ),
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} className="font-medium text-teal underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {withHighlightMarks(content)}
      </ReactMarkdown>
    </div>
  );
}
