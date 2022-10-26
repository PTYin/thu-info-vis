// noinspection JSUnresolvedVariable,JSUnresolvedFunction

import * as d3 from 'd3'

export default function voronoiCellTitle(titles, points) {
  const container = d3.create('div')
    .attr('id', 'voronoi-cell-title-container')

  for (let i = 0; i < titles.length && i < points.length; i++) {
    const [x, y] = points[i].pos
    container.append('p')
      .style('background-color', 'rgba(255,255,255,0.5)')
      .style('position', 'absolute')
      .style('left', `${x - 10}px`)
      .style('top', `${y - 20}px`)
      .text(titles[i])
  }

  return container
}