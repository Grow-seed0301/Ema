import { Spacing } from '@/constants/theme';

/**
 * Creates comprehensive HTML tag styles for react-native-render-html
 * that work with the app's theming system.
 * 
 * @param theme - The current theme object containing color properties
 * @returns An object with styles for various HTML tags
 */
export function createHtmlTagStyles(theme: {
  text: string;
  textSecondary: string;
  primary: string;
  backgroundSecondary: string;
  border: string;
}) {
  return {
    // Headings
    h1: { fontSize: 24, fontWeight: '700', color: theme.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    h2: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: Spacing.md, marginBottom: Spacing.sm },
    h3: { fontSize: 17, fontWeight: '700', color: theme.text, marginTop: Spacing.md, marginBottom: Spacing.xs },
    h4: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
    h5: { fontSize: 15, fontWeight: '700', color: theme.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
    h6: { fontSize: 14, fontWeight: '700', color: theme.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
    
    // Paragraphs and text
    p: { marginBottom: Spacing.md, color: theme.textSecondary, lineHeight: 26 },
    div: { marginBottom: Spacing.xs, color: theme.textSecondary, lineHeight: 26 },
    span: { color: theme.textSecondary, lineHeight: 26 },
    
    // Lists
    ul: { marginBottom: Spacing.md, marginLeft: Spacing.md, color: theme.textSecondary },
    ol: { marginBottom: Spacing.md, marginLeft: Spacing.md, color: theme.textSecondary },
    li: { marginBottom: Spacing.xs, color: theme.textSecondary, lineHeight: 26 },
    
    // Text formatting
    strong: { fontWeight: '700', color: theme.text },
    b: { fontWeight: '700', color: theme.text },
    em: { fontStyle: 'italic', color: theme.textSecondary },
    i: { fontStyle: 'italic', color: theme.textSecondary },
    u: { textDecorationLine: 'underline', color: theme.textSecondary },
    
    // Links
    a: { color: theme.primary, textDecorationLine: 'underline' },
    
    // Quotes and code
    blockquote: { 
      borderLeftWidth: 4, 
      borderLeftColor: theme.primary, 
      paddingLeft: Spacing.md, 
      marginLeft: Spacing.sm,
      marginBottom: Spacing.md,
      fontStyle: 'italic',
      color: theme.textSecondary 
    },
    code: { 
      fontFamily: 'monospace', 
      backgroundColor: theme.backgroundSecondary, 
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
      color: theme.text,
      fontSize: 14
    },
    pre: { 
      fontFamily: 'monospace', 
      backgroundColor: theme.backgroundSecondary, 
      padding: Spacing.sm,
      borderRadius: 8,
      marginBottom: Spacing.md,
      color: theme.text,
      fontSize: 14
    },
    
    // Tables
    table: { marginBottom: Spacing.md, borderWidth: 1, borderColor: theme.border },
    th: { fontWeight: '700', padding: Spacing.sm, backgroundColor: theme.backgroundSecondary, color: theme.text },
    td: { padding: Spacing.sm, borderWidth: 1, borderColor: theme.border, color: theme.textSecondary },
    
    // Horizontal rule
    hr: { marginVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  };
}
