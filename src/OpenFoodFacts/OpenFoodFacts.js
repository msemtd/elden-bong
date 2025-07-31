// Food nutrition and product information API
// https://world.openfoodfacts.org/data

// Can download the entire database as a DuckDB database file or jsonl
// https://world.openfoodfacts.org/data/food-products.duckdb
// https://blog.openfoodfacts.org/en/news/food-transparency-in-the-palm-of-your-hand-explore-the-largest-open-food-database-using-duckdb-%f0%9f%a6%86x%f0%9f%8d%8a

export class OpenFoodFacts {
  constructor () {
    this.apiUrl = 'https://world.openfoodfacts.org/api/v0/'
  }

  async searchProducts (query) {
    const response = await fetch(`${this.apiUrl}search.pl?search_terms=${query}`)
    const data = await response.json()
    return data.products
  }

  async getProductDetails (id) {
    const response = await fetch(`${this.apiUrl}product/${id}.json`)
    const data = await response.json()
    return data.product
  }
}
