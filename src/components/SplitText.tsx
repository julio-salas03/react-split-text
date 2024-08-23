import React, {
  useRef,
  useLayoutEffect,
  useState,
  memo,
  FC,
  forwardRef,
  MutableRefObject,
  CSSProperties,
  ComponentType,
  useEffect,
} from 'react';
import {
  LineWrapper,
  WordWrapper,
  LetterWrapper,
  LetterWrapperProp,
  WordWrapperProp,
  LineWrapperProp,
} from './Wrappers';

const DefaultLineWrapper = memo(LineWrapper);
const DefaultWordWrapper = memo(WordWrapper);
const DefaultLetterWrapper = memo(LetterWrapper);

export interface SplitTextProps<T = any> {
  /**
   * className to forward to the container.
   * @type string
   */
  className?: string;
  /**
   * A style object to forward to the container.
   * @type CSSProperties
   */
  style?: CSSProperties;
  /**
   * A React ref to forward to the container.
   * @type A React ref
   */
  ref?: ((instance: unknown) => void) | React.MutableRefObject<unknown> | null;
  /**
   * A custom component to wrap each split line.
   * @type ComponentType<LineWrapperProp>
   */
  LineWrapper?: ComponentType<LineWrapperProp>;
  /**
   * A custom component to wrap each split word.
   * @type ComponentType<WordWrapperProp>
   */
  WordWrapper?: ComponentType<WordWrapperProp>;
  /**
   * A custom component to wrap each split letter.
   * @type ComponentType<LetterWrapperProp>
   */
  LetterWrapper?: ComponentType<LetterWrapperProp>;
  /**
   * An extra value that will be forwarded to each wrappers.
   * @type T = any
   */
  extraProps?: T;
}

export const SplitText: FC<SplitTextProps> = forwardRef(function SplitText(
  {
    children,
    className,
    style,
    LineWrapper = DefaultLineWrapper,
    WordWrapper = DefaultWordWrapper,
    LetterWrapper = DefaultLetterWrapper,
    extraProps,
  },
  ref
) {
  let text = '';

  React.Children.map(children, child => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += String(child);
    } else {
      throw new Error(`SplitText expect a text as children`);
    }
  });
  const [lines, setLines] = useState<Array<string>>([]);
  const elRef = useRef<HTMLDivElement | null>(null);
  const maxCharPerLine = useRef(0);

  useEffect(() => {
    const el = elRef.current;

    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      setLines([]);
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.unobserve(el);
    };
  }, []);

  /**
   * Splits text into lines based on DOM measurements.
   */
  useLayoutEffect(() => {
    const el = elRef.current;

    if (lines.length || !el) return;

    maxCharPerLine.current = 0;
    let lastLineTop: null | number = null;
    let DOMLines: string[] = [];
    let words: string[] = [];
    for (const child of Array.from(el.children)) {
      const lineTop = child.getBoundingClientRect().top;
      if (lastLineTop === null) lastLineTop = lineTop;
      if (lineTop !== lastLineTop) {
        DOMLines.push(words.join(' '));
        words = [];
      }
      lastLineTop = lineTop;
      words.push((child.textContent || '').trim());
    }
    DOMLines.push(words.join(' '));
    setLines(DOMLines);
  }, [lines.length]);

  /**
   * Update lines when children changes
   */
  useLayoutEffect(() => {
    if (lines.length > 0) {
      const charPerLine =
        maxCharPerLine.current ||
        lines.map(line => line.length).sort((a, b) => b - a)[0];
      const newLines: string[] = [];
      let line: string = '';
      let charCount = 0;
      const words = text.split(' ');
      for (const word of words) {
        charCount += word.length + 1;
        if (charCount > charPerLine + 1) {
          newLines.push(line);
          line = '';
          charCount = 0;
        }
        line += word.trim() + ' ';
      }

      newLines.push(line);
      const trimmedNewLines = newLines.map(line => line.trim());

      const JOIN_CHAR = ' ';

      if (
        trimmedNewLines.join(JOIN_CHAR).trim() === lines.join(JOIN_CHAR).trim()
      )
        return;

      setLines(trimmedNewLines.map(line => line.trim()));

      if (charPerLine > maxCharPerLine.current) {
        maxCharPerLine.current = charPerLine;
      }
    }
  }, [lines, text]);

  let wordCount = 0;
  let letterCount = 0;

  return lines.length ? (
    <div
      className={className}
      ref={div => {
        elRef.current = div;
        if (typeof ref == 'function') {
          ref(div);
        } else if (ref) {
          (ref as MutableRefObject<HTMLDivElement | null>).current = div;
        }
      }}
      style={style}
    >
      {lines.map((line, i) => {
        let words = line.split(' ');
        words = words.map((word, i) =>
          i === words.length - 1 ? word : word + ' '
        );
        return (
          <LineWrapper key={i} lineIndex={i} extraProps={extraProps}>
            {words.map((word, j) => {
              const letters = word.split('');
              return (
                <WordWrapper
                  key={j}
                  lineIndex={i}
                  wordIndex={j}
                  countIndex={wordCount++}
                  extraProps={extraProps}
                >
                  {letters.map((char, k) => (
                    <LetterWrapper
                      key={k}
                      lineIndex={i}
                      wordIndex={j}
                      letterIndex={k}
                      countIndex={letterCount++}
                      extraProps={extraProps}
                    >
                      {char}
                    </LetterWrapper>
                  ))}
                </WordWrapper>
              );
            })}
          </LineWrapper>
        );
      })}
    </div>
  ) : (
    <div className={className} ref={elRef} style={style}>
      {text.split(' ').map((word, i) => (
        <span key={i}>{word} </span>
      ))}
    </div>
  );
});
