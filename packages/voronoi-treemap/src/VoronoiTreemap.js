// noinspection JSUnresolvedFunction,JSUnresolvedVariable

import * as d3 from 'd3'

export default function voronoiTreemap(root, {
  planeWidth = 960,
  planeHeight = 500,
  aDesired,
  errorThreshold = 1e-3,
  maxIteration = 10
}) {
  const planeArea = planeWidth * planeHeight
  const path = d3.path()
  const n = root.children.length
  // If aDesired is not specified, then initialize it as
  // the proportion for area size of each node divided by
  // total area size.
  if (!aDesired) {
    aDesired = []
    let total = 0
    for (let child of root.children) {
      const areaSize = 1 + (child.children && child.children.length || 0)
      aDesired.push(areaSize)
      total += areaSize
    }
    aDesired = aDesired.map(a => a / total)
    console.log(aDesired)
  }
  let points = []
  // Randomly initialize n points.
  for (let i = 0; i < n; i++)
    points.push([d3.randomUniform(planeWidth)(), d3.randomUniform(planeHeight)()])
  const weights = Array(n).fill(1)

  let stable = true, iteration = 0, voronoi
  do {
    voronoi = d3.Delaunay.from(points).voronoi([0, 0, planeWidth, planeHeight])
    stable = true
    const a = []
    for (let i = 0; i < n; i++) {
      const polygon = getCellPolygon(voronoi, i)
      const polygonArea = d3.polygonArea(polygon)
      a.push(polygonArea / planeArea)
      console.log(a[i])
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
    for (let i = 0; i < n; i++) {
      adjustWeight(i)
    }

    const moveGenerators = () => {
      points = []
      for (let i = 0; i < n; i++) {
        const polygon = getCellPolygon(voronoi, i)
        points.push(d3.polygonCentroid(polygon))
      }
      let factorWeight = 0x7fffffff
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const norm = Math.pow(points[i][0] - points[j][0], 2) + Math.pow(points[i][1] - points[j][1], 2)
          const factor = norm / (weights[i] + weights[j])
          if (0 < factor <factorWeight) {
            factorWeight = factor
          }
          if (factorWeight < 1) {
            for (let weight of weights) {
              weight = weight * factorWeight
            }
          }
        }
      }
    }
    console.log('iteration')
    moveGenerators()
  } while (!stable && iteration++ < maxIteration)

  voronoi.render(path)
  const svg = d3.create('svg')
    // .attr('viewBox', '0 0 960 500')
    .attr('width', 960)
    .attr('height', 500)
  svg.append('path')
    .attr('d', path)
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
  return {svg, points}
}

function getCellPolygon(voronoi, i) {
  const cell = voronoi.cellPolygon(i)
  // Exclude the last point and reverse to clockwise order.
  // E.g., the original cell equals [[0, 0], [0, 1], [1, 0], [0, 0]],
  // and the polygon should equal [[1, 0], [0, 1], [0, 0]].
  return cell.slice(0, -1).reverse()
}