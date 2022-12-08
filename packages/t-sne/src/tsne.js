// noinspection JSUnresolvedFunction

import {EventEmitter} from 'events'

import * as tf from '@tensorflow/tfjs'
import {setWasmPaths} from '@tensorflow/tfjs-backend-wasm'
import wasmSimdPath from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm'
import wasmSimdThreadedPath from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm'
import wasmPath from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm'
// import AutoEncoder from './ae'


const EPSILON = Number.EPSILON || 2.220446049250313e-16
class Tsne extends EventEmitter {

  constructor(config) {
    super()
    config = config || {}

    this.dim = config.dim || 2
    this.perplexity = config.perplexity || 30.0
    this.iterations = config.iterations || 1000
    this.iterationsPerCheckpoint = config.iterationsPerCheckpoint || 100

    this.alpha = config.dim - 1
    this.optimizer = tf.train.sgd(config.learningRate || 1000)
    // this.optimizer = tf.train.momentum(config.learningRate || 1000, config.momentum || 0.3)
    // this.optimizer = tf.train.adam(config.learningRate || 1000)
  }

  async init(config) {
    setWasmPaths({
      'tfjs-backend-wasm.wasm': wasmPath,
      'tfjs-backend-wasm-simd.wasm': wasmSimdPath,
      'tfjs-backend-wasm-threaded-simd.wasm': wasmSimdThreadedPath
    })
    await tf.setBackend(config.backend || 'wasm')
    this.X = tf.tensor(config.data || [])

    // Normalize input data
    this.X = tf.sub(this.X, this.X.min())
    this.X = tf.div(this.X, this.X.max())
    // this.X = tf.sub(this.X, tf.mean(this.X, 0))

    // Use PCA to initialize y
    // this.ae = new AutoEncoder({inputDim: this.X.shape[1], outputDim: 2, learningRate: 1,epochs: 100})
    // await this.ae.train(this.X)
    // this.y = this.ae.encode(this.X).variable()
    // Use normal distribution to initialize output embedding
    this.y = tf.randomStandardNormal([this.X.shape[0], this.dim], 'float32').variable()
  }

  run() {
    // (batchSize, )
    const summedSquaredX = tf.sum(tf.square(this.X), 1, true)
    // (batchSize, batchSize)
    const D = tf.sub(
      tf.add(summedSquaredX, summedSquaredX.transpose()),
      tf.mul(2, tf.matMul(this.X, this.X.transpose()))
    )
    let P = this.#jointProbability(D, this.perplexity)
    P = tf.mul(P, tf.sub(1, tf.eye(P.shape[0])))          // zero diagonal
    P = tf.div(tf.add(P, P.transpose()), 2 * P.shape[0])  // symmetric
    P = tf.maximum(P, EPSILON)
    let loss, iter = 0
    const setIntervalId = setInterval(() => {
      if (iter === this.iterations) {
        console.log(`Training completed, KL divergence ${loss}`)
        this.emit('checkpoint', loss, this.iterations)
        clearInterval(setIntervalId)
        return
      }
      loss = this.optimizer.minimize(() => this.#step(P), true, [this.y])
      if (iter % this.iterationsPerCheckpoint === 0) {
        console.log(`Iteration ${iter} / ${this.iterations}, KL divergence ${loss}`)
        this.emit('checkpoint', loss, iter)
      }
      iter++
    }, 1)
  }

  #step(P) {
    const n = this.y.shape[0]
    const summedSquareY = tf.sum(tf.square(this.y), 1, true)
    const D = tf.sub(
      tf.add(summedSquareY, summedSquareY.transpose()),
      tf.mul(2, tf.matMul(this.y, this.y.transpose()))
    )
    let Q = tf.pow(tf.add(1, tf.div(D, this.alpha)), -(this.alpha + 1) / 2)
    Q = tf.mul(Q, tf.sub(1, tf.eye(n)))
    Q = tf.div(Q, tf.sum(Q))
    Q = tf.maximum(Q, EPSILON)

    return tf.sum(tf.mul(P, tf.log(tf.div(P, Q))))
  }

  getY() {
    // Normalize output to [-1, 1]
    let y = tf.sub(this.y, this.y.min())
    y = tf.div(y, y.max())
    y = tf.sub(tf.mul(2, y), 1)
    return y.arraySync()
  }

  /**
   * Given the squared distance matrix, return a joint probability matrix.
   * @param D distance matrix
   * @param {number} u expected perplexity
   * @param {number} tolerance
   */
  #jointProbability(D, u, tolerance = 1e-4) {
    const n = D.shape[0]
    let P = []

    const gaussianKernelAndPerplexity = (i, d, beta) => {
      let prob = tf.exp(tf.neg(tf.mul(d, beta)))
      const buffer = prob.bufferSync()
      buffer.set(0, i)
      prob = buffer.toTensor()
      const summedProb = tf.sum(prob)
      prob = tf.div(prob, summedProb)
      const pp = tf.add(
        tf.log(summedProb),
        tf.mul(beta, tf.mul(d, prob).sum())
      )
      return [pp, prob]
    }

    for (let i = 0; i < n; i++) {
      let beta = 1., betaMin = -Infinity, betaMax = Infinity

      P.push([])
      let ppDiff, logU = tf.log(u), iterations = 0
      do {
        const [pp, prob] = gaussianKernelAndPerplexity(i, D.slice(i, 1).squeeze(), beta)
        ppDiff = tf.sub(pp, logU).arraySync()
        // Bisection method
        if (ppDiff > 0) {
          betaMin = beta
          beta = betaMax === Infinity ? beta * 2 : (beta + betaMax) / 2
        }
        else {
          betaMax = beta
          beta = betaMin === -Infinity ? beta / 2 : (beta + betaMin) / 2
        }
        P[i] = prob
      } while (Math.abs(ppDiff) > tolerance && ++iterations < 10)
    }
    P = tf.stack(P)
    return P
  }

}

export default Tsne