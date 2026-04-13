/**
 * BeansDb - do you like beans?
 * UK's cheapest brands of baked beans (the supermarket chains' own brands) are
 * way better that Heinz. FIGHT ME!
 *
 * https://kewey.furvect.com/sumo/beans/beans2.mp4
 */

export class BeansDb {
  constructor (data) {
    this.data = data
    // images directory
    // do the products change? same barcode but different product? is that legal?
    // barcode rules - https://en.wikipedia.org/wiki/International_Article_Number
    // use openfoodfacts to retrieve the product information
    // So far Lidl and Tesco's bargain brands are the best
    // https://world.openfoodfacts.org/api/v0/product/4056489904373.json
    // https://world.openfoodfacts.org/product/4056489904373/simply-baked-beans-lidl
    // https://world.openfoodfacts.org/product/5057545744741/baked-beans-in-tomato-sauce-stockwell-co
    // shoot-out in 3D - beans can characters
  }
}
