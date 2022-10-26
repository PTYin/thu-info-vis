// noinspection JSUnresolvedVariable,JSUnresolvedFunction

import * as d3 from 'd3'

export default function voronoiCellTitle(titles, points, {
  start = [0, 0],
  planeWidth = 960,
  planeHeight = 500,
}) {
  const container = d3.create('svg')
    .attr('id', 'voronoi-cell-title-container')
    .attr('viewBox', `0 0 ${planeWidth} ${planeHeight}`)
    .attr('width', '100%')
    .attr('height', '90vh')

  for (let i = 0; i < titles.length && i < points.length; i++) {
    const [x, y] = points[i].pos
    container.append('rect')
      .attr('x', start[0] + x - 20)
      .attr('y', start[1] + y - 15)
      .attr('width', '40px')
      .attr('height', '20px')
      .attr('fill', 'rgba(255, 255, 255, 0.5)')
    container.append('text')
      .attr('x', start[0] + x - 15)
      .attr('y', start[1] + y)
      .text(titles[i])
  }

  return container
}