export const docsSearchOptions = {
  fields: ['title', 'heading', 'text'],
  storeFields: ['title', 'heading', 'snippet', 'url'],
  searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND' as const },
};
