// noinspection JSUnresolvedFunction

import * as d3 from 'd3'
import china from './assets/China.json'
import voronoiTreemap from './VoronoiTreemap'
import voronoiCellTitle from './VoronoiCellTitle'

const buildTree = (city, fatherD3Node) => {
  const d3Node = {name: '', children: []}
  fatherD3Node && fatherD3Node.children.push(d3Node)
  for (let key in city) {
    if (Array.isArray(city[key])) {
      for (let subarea of city[key])
        buildTree(subarea, d3Node)
    }
    else
      d3Node.name = city[key]
  }
  return d3Node
}
const tree = buildTree(china, null)
const root = d3.hierarchy(tree)
const {svg, points} = voronoiTreemap(root, {})
const cellTitleContainer = voronoiCellTitle(root.children.map(child => child.data.name), points, {})
d3.select('body').append('h1')
  .style('text-align', 'center')
  .style('margin', '0 auto')
  .style('line-height', '10vh')
  .text('Visualization on China districts using Voronoi treemap.')
d3.select('body').append(() => svg.node()).style('position', 'absolute')
d3.select('body').append(() => cellTitleContainer.node()).style('position', 'absolute')
