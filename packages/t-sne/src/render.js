// noinspection JSUnresolvedFunction

import * as d3 from 'd3'
import Nanobar from 'nanobar'
import mnist from './assets/sampled.json'

export default function Renderer() {
  d3.select('body').append('h1')
    .style('text-align', 'center')
    .style('margin', '0 auto')
    .style('line-height', '10vh')
    .text('MNIST Visualization using T-SNE.')

  // set the dimensions and margins of the graph
  const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom

  // append the svg object to the body of the page
  this.svg = d3.select('body')
    .append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('width', '100%')
    .attr('height', '85vh')
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)


  this.x = d3.scaleLinear()
    .domain([-1, 1])
    .range([0, width])
  this.svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(this.x))

  // Add Y axis
  this.y = d3.scaleLinear()
    .domain([-1, 1])
    .range([height, 0])
  this.svg.append('g')
    .call(d3.axisLeft(this.y))
  this.dots = this.svg.append('g')

  this.color = d3.scaleOrdinal(d3.schemeCategory10)

  d3.select('body')
    .append('div')
    .attr('id', 'progress-bar')
  this.progressBar = new Nanobar({
    id: 'progress-bar',
    target: document.getElementById('progress-bar')
  })
}

Renderer.prototype.render = function (data, iter) {
  this.dots.selectAll('circle').remove()
  this.dots.selectAll('circle').data(data).enter()
    .append('circle')
    .attr('cx', d => this.x(d[0]))
    .attr('cy', d => this.y(d[1]))
    .attr('r', 5)
    .style('fill', (d, index) => this.color(mnist.labels[index]))
  if (iter) {
    this.progressBar.go(iter / 10)
  }
}
