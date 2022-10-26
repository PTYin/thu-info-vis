// noinspection JSUnresolvedFunction,JSUnresolvedVariable

import * as d3 from 'd3'
import * as d3Plugin from 'd3-weighted-voronoi'

export default function voronoiTreemap(root, {
  planeWidth = 960,
  planeHeight = 500,
  aDesired,
  errorThreshold = 1e-3,
  maxIteration = 1000
}) {
  const planeArea = planeWidth * planeHeight
  const n = root.children.length
  // If aDesired is not specified, then initialize it as
  // the proportion for area size of each node divided by
  // total area size.
  if (!aDesired) {
    aDesired = []
    let total = 0
    for (let child of root.children) {
      const areaSize = 1 + (child.descendants().length || 0)
      aDesired.push(areaSize)
      total += areaSize
    }
    aDesired = aDesired.map(a => a / total)
  }
  let points = []
  // Randomly initialize n points.
  const randomX = d3.randomUniform(planeWidth), randomY = d3.randomUniform(planeHeight)
  for (let i = 0; i < n; i++)
    // points.push([d3.randomUniform(planeWidth)(), d3.randomUniform(planeHeight)()])
    points.push({id: i, pos: [randomX(), randomY()]})
  const weights = Array(n).fill(1)

  let stable = true, iteration = 0, weightedVoronoi
  const computeWeightedVoronoi = d3Plugin.weightedVoronoi()
    .x(point => point.pos[0])
    .y(point => point.pos[1])
    .weight(point => weights[point.id])
    .clip([[0, 0], [0, planeHeight], [planeWidth, planeHeight], [planeWidth, 0]])
  do {
    weightedVoronoi = computeWeightedVoronoi(points)
    stable = true
    const a = Array(n).fill(0)
    for (let polygon of weightedVoronoi) {
      const i = polygon.site.originalObject.id
      const polygonArea = d3.polygonArea(polygon)
      a[i] = polygonArea / planeArea
      if (Math.abs(a[i] - aDesired[i]) >= errorThreshold)
        stable = false
    }

    const adjustWeight = (i) => {
      const delta = 1e-9
      if (Math.abs(weights[i]) < delta) {
        weights[i] = Math.sign(weights[i]) * delta
      }
      weights[i] = weights[i] + Math.abs(weights[i]) * (aDesired[i] - a[i]) / aDesired[i]
    }
    for (let i = 0; i < n; i++)
      adjustWeight(i)

    const moveGenerators = () => {
      for (let polygon of weightedVoronoi) {
        const i = polygon.site.originalObject.id
        points[i].pos = d3.polygonCentroid(polygon)
      }
      let factorWeight = 0x7fffffff
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j)
            continue
          const norm = Math.pow(points[i][0] - points[j][0], 2) + Math.pow(points[i][1] - points[j][1], 2)
          const factor = norm / (weights[i] + weights[j])
          if (0 < factor && factor <factorWeight) {
            factorWeight = factor
          }
        }
      }
      if (factorWeight < 1) {
        for (let weight of weights) {
          weight = weight * factorWeight
        }
      }
    }
    console.log('iteration')
    moveGenerators()
  } while (!stable && iteration++ < maxIteration)

  const svg = d3.create('svg')
    .attr('viewBox', '0 0 960 500')
    .attr('width', planeWidth)
    .attr('height', planeHeight)
  const polygon = svg.append('g').selectAll('path').data(weightedVoronoi)
  polygon.enter().append('path')
    .attr('d', d => 'M' + d.join('L') + 'Z')
    .attr('stroke-width', 1.5)
    .attr('stroke', 'steelblue')
    .attr('fill', 'none')
    // .attr('fill', d => d3.scaleLinear().domain([0, root.height]).range(['red', 'pink'])(d.depth))
    // .attr('fill-opacity', d => (d.depth < max_depth && d.children) ? 0 : 1)
  polygon.exit().remove()
  return {svg, points}
}
