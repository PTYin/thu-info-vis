import Tsne from './tsne'
import mnist from './assets/sampled.json'
import Renderer from './render'

const flattenedImages = mnist.images.map(image => image.flat())
const renderer = new Renderer()
const tsne = new Tsne({
  dim: 2,
  perplexity: 30,
  learningRate: 1000,
  iterations: 1000
})

tsne.on('checkpoint', (loss, iter) => {
  const y = tsne.getY()
  renderer.render(y, iter)
})


window.onload = () => {
  tsne.init({
    data: flattenedImages.slice(0, 1000)
  }).then(() => tsne.run())
}
