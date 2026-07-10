/**
 * A List is a named target-audience segment (e.g. "Recruiters",
 * "Potential Clients", "Q3 Outreach"). Like tags, lists are stored globally
 * as a single dictionary of List records and contacts reference them by id —
 * so renaming or recoloring a list updates it everywhere at once. Unlike
 * tags, lists are the primary way the Dashboard is organized: the left
 * navigator is a list of lists, and selecting one filters the people shown.
 *
 * A contact can belong to any number of lists (many-to-many via
 * `Contact.listIds`).
 */
export interface ContactList {
  id: string;
  name: string;
  /** Hex color used for the list's dot/accent in the navigator and chips. */
  color: string;
  /** Optional short description of who this audience is. */
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A LinkedIn-flavored, high-contrast palette for list accents. Kept distinct
 * from the tag palette so lists read as a different kind of object.
 */
export const LIST_COLOR_PALETTE = [
  '#0A66C2', // linkedin blue
  '#057642', // success green
  '#E7A33E', // warning amber
  '#7A3E9D', // purple
  '#0E8A9C', // teal
  '#C1442E', // rust
  '#B24020', // brown-orange
  '#44712E', // olive
  '#915907', // ochre
] as const;
