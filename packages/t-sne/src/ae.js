import * as tf from '@tensorflow/tfjs'

export default function AutoEncoder(config) {
  this.model = tf.sequential()
  this.epochs = config.epochs || 100
  this.batchSize = config.batchSize || 100
  this.iterationsPerCheckpoint = config.iterationsPerCheckpoint || 20

  const encoder = tf.layers.dense({
    name: 'encoder',
    units: config.outputDim || 2,
    batchInputShape: [null, config.inputDim],
    activation: 'relu',
    kernelInitializer: 'randomNormal',
    biasInitializer: 'ones'
  })
  const decoder = tf.layers.dense({
    name: 'decoder',
    units: config.inputDim,
    activation: 'relu',
    kernelInitializer: 'randomNormal',
    biasInitializer: 'ones'
  })

  this.model.add(encoder)
  this.model.add(decoder)
  this.optimizer = tf.train.sgd(config.learningRate || 10)
}

AutoEncoder.prototype.encode = function (X) {
  return this.model.getLayer('encoder').apply(X)
}

AutoEncoder.prototype.train = async function (X) {
  await this.model.compile({optimizer: this.optimizer, loss: 'meanSquaredError'})
  const checkpoints = Math.floor(this.epochs / this.iterationsPerCheckpoint)
  for (let i = 0; i < checkpoints; i++) {
    const h = await this.model.fit(X, X, {
      epochs: this.iterationsPerCheckpoint, batchSize: this.batchSize, shuffle:true
    })
    console.log(`PCA Loss ${h.history.loss[0]} after Epoch ${i * this.iterationsPerCheckpoint} / ${this.epochs}`)
  }
}