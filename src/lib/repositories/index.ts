// Repository bindings. Default bindings call Medusa; JSON repos remain
// available for offline development or seeding new starters.
//
// Blog and CMS pages stay JSON-backed because Medusa has no native blog/CMS
// concept. Swap them for a CMS connector (Sanity, Strapi, Contentful, etc.)
// by implementing the same interfaces and changing these exports.

export { medusaProductRepository as productRepository } from "./medusa-product-repository"
export { medusaCategoryRepository as categoryRepository } from "./medusa-category-repository"
export { medusaBrandRepository as brandRepository } from "./medusa-brand-repository"
export { medusaCollectionRepository as collectionRepository } from "./medusa-collection-repository"
export { jsonPageRepository as pageRepository } from "./json-page-repository"
export { jsonBlogRepository as blogRepository } from "./json-blog-repository"
export type { Collection } from "./medusa-collection-repository"
